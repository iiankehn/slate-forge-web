#!/usr/bin/env python3
"""Compare the published Slate Forge shell/worker files with promoted bytes."""
import argparse
import concurrent.futures
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import time
import urllib.request

ORIGIN = 'https://slate-web.iiankehn.com/'
MAX_FILE = 25_000_000


def require(condition, message):
    if not condition:
        raise ValueError(message)


def name(value):
    require(isinstance(value, str), 'Invalid asset name.')
    value = value.removeprefix('./')
    path = PurePosixPath(value)
    require(bool(value) and not path.is_absolute() and '..' not in path.parts and
            '\\' not in value and ':' not in value and path.as_posix() == value, 'Unsafe asset path.')
    return value


def verified_site(site, metadata):
    require(re.fullmatch(r'[a-f0-9]{40}', metadata.get('source', '')) and
            re.fullmatch(r'[a-f0-9]{64}', metadata.get('archive_sha256', '')), 'Invalid release provenance.')
    require(all(isinstance(metadata.get(key), int) and metadata[key] > 0 for key in ['ci_run', 'artifact_id']), 'Invalid release run/artifact identity.')
    expected = metadata.get('files', {})
    require(0 < len(expected) <= 2000, 'Invalid release manifest.')
    actual = {}
    for path in Path(site).rglob('*'):
        require(not path.is_symlink(), 'Release symlinks are refused.')
        if not path.is_file():
            continue
        relative = name(path.relative_to(site).as_posix())
        require(path.stat().st_size <= MAX_FILE, 'Oversized release file.')
        data = path.read_bytes()
        actual[relative] = data
        require(sum(len(value) for value in actual.values()) <= 250_000_000, 'Oversized release.')
    require(set(actual) == set(expected), 'Release manifest file set differs.')
    for relative, data in actual.items():
        require(expected[relative] == {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()},
                'Release file digest differs: ' + relative)
    worker = actual['sw.js'].decode()
    match = re.search(r'const ASSETS=(\[.*?\]);const OPTIONAL=(\[.*?\]);const ROOT=', worker)
    version = re.search(r"const CACHE=PREFIX\+'([a-f0-9]{16})'", worker)
    require(match is not None and version is not None, 'Worker manifest is missing.')
    assets, optional = [json.loads(value) for value in match.groups()]
    require(isinstance(assets, list) and isinstance(optional, list) and len(assets) + len(optional) <= 2000,
            'Invalid worker asset lists.')
    digest = hashlib.sha256()
    for relative in ['index.html', *assets, *optional]:
        digest.update(actual[name(relative)])
    require(digest.hexdigest()[:16] == version.group(1), 'Worker cache digest differs.')
    names = list(dict.fromkeys(name(value) for value in ['index.html', 'sw.js', *assets,
                           'pdf-workspace.js', 'ocr-workspace.js', 'semantic-worker.js']))
    require(all(value in actual for value in names), 'Worker entry point is missing.')
    return actual, names, version.group(1)


def fetch(relative):
    path = '' if relative == 'index.html' else relative
    request = urllib.request.Request(ORIGIN + path, headers={'Cache-Control': 'no-cache'})
    with urllib.request.urlopen(request, timeout=30) as response:
        require(response.status == 200 and response.geturl().startswith(ORIGIN), 'Unexpected live response.')
        data = response.read(MAX_FILE + 1)
        require(len(data) <= MAX_FILE, 'Oversized live response.')
        return data


def verify(site, metadata, fetcher=fetch):
    files, names, version = verified_site(site, metadata)
    def check(relative):
        require(fetcher(relative) == files[relative], 'Live bytes differ: ' + relative)
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        list(pool.map(check, names))
    return {key: metadata[key] for key in ['source', 'ci_run', 'artifact_id', 'archive_sha256']} | {
        'artifact_files': len(files), 'artifact_bytes': sum(map(len, files.values())),
        'live_assets_verified': len(names), 'live_exact_artifact_match': True, 'worker_cache_digest': version}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--site', required=True)
    parser.add_argument('--metadata', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    metadata = json.loads(Path(args.metadata).read_text())
    verified_site(args.site, metadata)  # refuse invalid candidates before network requests
    for attempt in range(1, 6):
        try:
            result = verify(args.site, metadata)
            break
        except Exception:
            if attempt == 5:
                raise
            time.sleep(3)
    result['publication_check_attempts'] = attempt
    Path(args.output).write_text(json.dumps(result, indent=2) + '\n')
    summary = ('## Live release verified\n\nSource: `' + result['source'] + '`\n\n' +
               str(result['live_assets_verified']) + ' shell/worker URLs match the exact promoted artifact.\n\n' +
               'Archive SHA-256: `' + result['archive_sha256'] + '`\n\nWorker cache: `' + result['worker_cache_digest'] +
               '`\n\nPublication checks: ' + str(attempt) + '\n')
    print(summary)
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as file:
            file.write(summary)


if __name__ == '__main__':
    main()
