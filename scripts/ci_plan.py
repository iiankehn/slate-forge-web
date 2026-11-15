#!/usr/bin/env python3
"""Plan GitHub-owned checks and enforce the stable verification gate."""
import argparse
import json
import os
from pathlib import PurePosixPath
import re
import subprocess


def documentation_only(paths):
    def documentation(name):
        path = PurePosixPath(name)
        if path.is_absolute() or '..' in path.parts or name.startswith('docs/fixtures/'):
            return False
        return (name.startswith('docs/') and path.suffix.lower() == '.md') or (name.startswith('docs/ui/') and path.suffix.lower() in {'.png', '.jpg', '.jpeg', '.webp', '.svg'}) or name in {'AGENTS.md', 'README.md', 'CHANGELOG.md', 'CONTRIBUTING.md', 'SECURITY.md', 'CODE_OF_CONDUCT.md'}
    return bool(paths) and all(documentation(name) for name in paths)


def requires_runtime(paths, event, reliable=True):
    return not reliable or event == 'workflow_dispatch' or not documentation_only(paths)


def gate(needs):
    plan = needs.get('plan', {})
    runtime = plan.get('outputs', {}).get('runtime')
    if plan.get('result') != 'success' or runtime not in {'true', 'false'}:
        raise ValueError('Check planning did not complete; verification is blocked.')
    expected = 'success' if runtime == 'true' else 'skipped'
    for name in ['build', 'node', 'tooling', 'browser', 'office']:
        if needs.get(name, {}).get('result') != expected:
            raise ValueError(name + ' did not complete as required; verification is blocked.')
    return runtime == 'true'


def summary(text):
    path = os.environ.get('GITHUB_STEP_SUMMARY')
    if path:
        with open(path, 'a') as file:
            file.write(text + '\n')
    print(text)


def plan(base, event):
    valid = bool(re.fullmatch(r'[a-f0-9]{40}', base or '') and set(base) != {'0'})
    reliable = valid and subprocess.run(['git', 'cat-file', '-e', base + '^{commit}'], capture_output=True).returncode == 0
    if not reliable:
        base = 'HEAD^'
        if subprocess.run(['git', 'cat-file', '-e', base], capture_output=True).returncode:
            base = None
    if base:
        paths = subprocess.check_output(['git', 'diff', '--name-only', '-z', base, 'HEAD', '--']).decode().split('\0')
        whitespace = ['git', 'diff', '--check', base, 'HEAD', '--', '.', ':!dist/*.js', ':!dist/chunks/*', ':!test/fixtures/office-probes/OpenDocument-v1.3-schema.rng']
    else:
        paths = subprocess.check_output(['git', 'ls-files', '-z']).decode().split('\0')
        whitespace = ['git', 'show', '--check', '--format=', 'HEAD', '--', '.', ':!dist/*.js', ':!dist/chunks/*', ':!test/fixtures/office-probes/OpenDocument-v1.3-schema.rng']
    paths = [name for name in paths if name]
    subprocess.run(whitespace, check=True)
    runtime = requires_runtime(paths, event, reliable)
    with open(os.environ['GITHUB_OUTPUT'], 'a') as file:
        file.write('runtime=' + str(runtime).lower() + '\n')
    summary('Runtime checks required: **' + str(runtime).lower() + '**. Changed paths: ' + str(len(paths)) + '. Source whitespace passed.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['plan', 'gate'])
    parser.add_argument('--base', default='')
    parser.add_argument('--event', default='')
    args = parser.parse_args()
    if args.command == 'plan':
        plan(args.base, args.event)
    else:
        runtime = gate(json.loads(os.environ['NEEDS_JSON']))
        summary('## Verification passed\n\n' + ('Build, Node regressions, tooling policy, Office exchange and every requested browser profile passed. Retry-only browser passes remain failures.' if runtime else 'Documentation-only change: source whitespace passed; runtime checks were explicitly skipped. No promotable runtime artifact was created.'))


if __name__ == '__main__':
    main()
