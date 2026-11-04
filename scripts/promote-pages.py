#!/usr/bin/env python3
"""Promote an immutable artifact from successful main CI; never build the site."""
import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import stat
import subprocess
import tempfile
import zipfile

MAX_TOTAL = 250_000_000
MAX_FILE = 25_000_000
REQUIRED = {'index.html', 'app.js', 'app.css', 'sw.js', 'manifest.webmanifest', 'THIRD-PARTY-NOTICES.txt'}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def select_artifact(repo, run, workflow, jobs, comparison, artifacts):
    require((run.get('repository') or {}).get('full_name') == repo and
            (run.get('head_repository') or {}).get('full_name') == repo, 'Verification must belong to this repository.')
    require(run.get('workflow_id') == workflow.get('id'), 'Verification must use ci.yml.')
    require(run.get('event') == 'push' and run.get('head_branch') == 'main', 'Only main push verification may be promoted.')
    require(run.get('status') == 'completed' and run.get('conclusion') == 'success', 'Verification has not completed successfully.')
    require(re.fullmatch(r'[a-f0-9]{40}', (run.get('head_sha') or '')), 'Invalid verified source SHA.')
    verify = [job for job in jobs.get('jobs', []) if job.get('name') == 'verify']
    require(len(verify) == 1 and verify[0].get('status') == 'completed' and verify[0].get('conclusion') == 'success',
            'The main verification job must pass; skipped or missing jobs are not verification.')
    require(comparison.get('status') in {'ahead', 'identical'}, 'Verified source is not an ancestor of current main.')
    require(artifacts.get('total_count', 0) <= 100, 'Artifact listing is ambiguous.')
    matches = [a for a in artifacts.get('artifacts', []) if a.get('name') == 'static-site']
    require(len(matches) == 1, 'Exactly one static-site artifact is required.')
    artifact = matches[0]
    require(isinstance(artifact.get('id'), int) and artifact['id'] > 0, 'Invalid artifact ID.')
    require(not artifact.get('expired') and 0 < artifact.get('size_in_bytes', 0) <= MAX_TOTAL, 'Artifact is expired or too large.')
    require(re.fullmatch(r'sha256:[a-f0-9]{64}', (artifact.get('digest') or '')), 'Artifact must have a SHA-256 digest.')
    provenance = artifact.get('workflow_run') or {}
    require(provenance.get('id') == run.get('id') and provenance.get('head_sha') == run['head_sha'],
            'Artifact provenance does not match the verified run/source.')
    return artifact


def extract_verified(archive, digest, output):
    archive, output = Path(archive), Path(output)
    require(archive.stat().st_size <= MAX_TOTAL, 'Downloaded artifact exceeds the release budget.')
    with archive.open('rb') as file:
        actual = hashlib.file_digest(file, 'sha256').hexdigest()
    require('sha256:' + actual == digest, 'Artifact digest mismatch; refusing deployment.')
    require(not output.exists(), 'Promotion output must be a new directory.')
    with zipfile.ZipFile(archive) as bundle:
        entries = bundle.infolist()
        require(0 < len(entries) <= 2000, 'Artifact has too many entries.')
        total, names, files = 0, set(), set()
        for entry in entries:
            name = entry.filename
            path = PurePosixPath(name)
            require('\x00' not in entry.orig_filename and '\\' not in name and not path.is_absolute() and
                    name.rstrip('/') == path.as_posix() and '..' not in path.parts and
                    all(':' not in part for part in path.parts), 'Unsafe artifact path.')
            require(not any(part in {'.git', '.openai'} or part.startswith('.env') for part in path.parts), 'Unexpected configuration in artifact.')
            require(path.as_posix() not in names, 'Duplicate artifact path.')
            names.add(path.as_posix())
            kind = stat.S_IFMT(entry.external_attr >> 16)
            require(kind in {0, stat.S_IFREG, stat.S_IFDIR} and not entry.flag_bits & 1, 'Links or encrypted entries are unsupported.')
            require((kind != stat.S_IFDIR or entry.is_dir()) and (kind != stat.S_IFREG or not entry.is_dir()), 'Invalid artifact entry type.')
            total += entry.file_size
            require(entry.file_size <= MAX_FILE and total <= MAX_TOTAL, 'Expanded artifact exceeds release budgets.')
            if not entry.is_dir():
                files.add(path.as_posix())
        require(REQUIRED <= files, 'Verified site is incomplete.')
        require(not any(parent.as_posix() in files for name in names for parent in PurePosixPath(name).parents), 'Artifact file/directory collision.')
        output.mkdir(parents=True)
        for entry in entries:
            target = output / entry.filename
            if entry.is_dir():
                target.mkdir(parents=True, exist_ok=True)
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                with bundle.open(entry) as source, target.open('xb') as destination:
                    while chunk := source.read(1024 * 1024):
                        destination.write(chunk)
    return actual


def api(path):
    result = subprocess.run(['gh', 'api', path], check=True, capture_output=True)
    return json.loads(result.stdout)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run-id', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    repo = os.environ.get('GITHUB_REPOSITORY', '')
    require(re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+', repo), 'Missing repository identity.')
    require(re.fullmatch(r'[1-9][0-9]*', args.run_id), 'Verification run ID must be numeric.')
    base = 'repos/' + repo
    run = api(base + '/actions/runs/' + args.run_id)
    require(re.fullmatch(r'[a-f0-9]{40}', (run.get('head_sha') or '')), 'Invalid source SHA.')
    artifact = select_artifact(repo, run, api(base + '/actions/workflows/ci.yml'),
                               api(base + '/actions/runs/' + args.run_id + '/jobs?per_page=100'),
                               api(base + '/compare/' + run['head_sha'] + '...main'),
                               api(base + '/actions/runs/' + args.run_id + '/artifacts?per_page=100'))
    with tempfile.TemporaryDirectory(prefix='slate-pages-') as temporary:
        archive = Path(temporary) / 'static-site.zip'
        with archive.open('wb') as destination:
            download = subprocess.run(['gh', 'api', base + '/actions/artifacts/' + str(artifact['id']) + '/zip'], stdout=destination, stderr=subprocess.PIPE)
            if download.returncode:
                status = re.search(r'HTTP (\d{3})', download.stderr.decode('utf-8', errors='replace'))
                detail = ' (HTTP ' + status.group(1) + ')' if status else ''
                raise ValueError('GitHub artifact download failed' + detail + '; no deployment was prepared.')
        digest = extract_verified(archive, artifact['digest'], args.output)
    summary = ('Verified source: `' + run['head_sha'] + '`\n\nCI run: https://github.com/' + repo + '/actions/runs/' +
               args.run_id + '\n\nArtifact: `' + str(artifact['id']) + '`\n\nSHA-256: `' + digest + '`\n')
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as file:
            file.write(summary)
    print(summary)


if __name__ == '__main__':
    main()
