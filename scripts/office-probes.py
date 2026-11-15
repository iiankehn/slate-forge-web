#!/usr/bin/env python3
"""Run committed Office exchange probes on a GitHub runner, retaining evidence."""
import argparse
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'test/fixtures/office-probes/manifest.json'


def require(condition, message):
    if not condition:
        raise ValueError(message)


def select_cases(manifest, choice):
    require(isinstance(manifest, dict) and 0 < len(manifest) <= 100, 'Invalid Office manifest.')
    require(choice == 'all' or choice in manifest, 'Unknown Office probe.')
    cases = manifest if choice == 'all' else {choice: manifest[choice]}
    for key, spec in cases.items():
        require(re.fullmatch(r'[a-z0-9-]{1,80}', key), 'Invalid Office probe ID.')
        path = (ROOT / spec['input']).resolve()
        require(path.is_relative_to(ROOT) and path.suffix == '.odt', 'Unsafe Office input.')
        require(isinstance(spec['pages'], list) and 0 < len(spec['pages']) <= 20 and
                all(value in {'portrait', 'landscape'} for value in spec['pages']), 'Invalid expected pages.')
        require(isinstance(spec['pixel_identical'], bool), 'An explicit render policy is required.')
        require(isinstance(spec.get('normalize', False), bool), 'Invalid normalization policy.')
        require(spec.get('normalized_format', 'odt') in {'odt', 'docx'} and
                (spec.get('normalized_format', 'odt') == 'odt' or spec.get('normalize')), 'Invalid normalized format.')
    return cases


def command(args, *, env=None):
    result = subprocess.run(args, env=env, capture_output=True, text=True, timeout=90)
    require(result.returncode == 0, 'Probe command failed: ' + '\n'.join(result.stderr.splitlines()[-12:]))
    return result.stdout


def run_case(key, spec, output):
    import fitz
    from lxml import etree
    source = ROOT / spec['input']
    require(source.stat().st_size <= 5_000_000, 'Oversized Office input.')
    schema = etree.RelaxNG(etree.parse(str(MANIFEST.parent / 'OpenDocument-v1.3-schema.rng'),
                                     etree.XMLParser(resolve_entities=False, no_network=True)))
    def validate_input(path):
        with zipfile.ZipFile(path) as bundle:
            entries = bundle.infolist()
            require(len(entries) <= 1000 and sum(entry.file_size for entry in entries) <= 50_000_000,
                    'Office input exceeds archive bounds.')
            require(entries[0].filename == 'mimetype' and entries[0].compress_type == 0, 'Invalid ODT mimetype placement.')
            for part in ['content.xml', 'styles.xml']:
                data = bundle.read(part)
                require(len(data) <= 20_000_000 and b'<!DOCTYPE' not in data and b'<!ENTITY' not in data, 'Unsafe input XML.')
                node = etree.fromstring(data, etree.XMLParser(resolve_entities=False, no_network=True))
                require(schema.validate(node), 'ODF 1.3 input validation failed: ' + str(schema.error_log))
    validate_input(source)
    validated_parts = 2
    case_output = output / key
    case_output.mkdir()
    with tempfile.TemporaryDirectory(prefix='slate-office-') as temporary:
        work = Path(temporary)
        inputs = work / 'input'
        inputs.mkdir()
        input_copy = inputs / (key + '.odt')
        shutil.copyfile(source, input_copy)
        app_input = input_copy
        exchange_format = spec.get('normalized_format', 'odt')
        conversions = []
        if spec.get('normalize'):
            app_input = case_output / (key + '.' + exchange_format)
            command(['node', str(ROOT / 'scripts/prepare-office-probe.mjs'), str(input_copy), str(app_input)])
            if exchange_format == 'odt':
                validate_input(app_input)
                validated_parts += 2
                conversions.append(('pdf', case_output / 'normalized-pdf', app_input))
        conversions += [(exchange_format, case_output / 'resaved', app_input),
                        ('pdf', case_output / 'source-pdf', app_input if exchange_format == 'docx' else input_copy),
                        ('pdf', case_output / 'resaved-pdf', case_output / 'resaved' / (key + '.' + exchange_format))]
        for index, (fmt, destination, input_path) in enumerate(conversions):
            destination.mkdir()
            profile = work / ('profile-' + str(index))
            profile.mkdir()
            env = {'PATH': os.environ.get('PATH', '/usr/bin:/bin'), 'HOME': str(profile),
                   'TMPDIR': str(work), 'LANG': 'C.UTF-8', 'TZ': 'UTC'}
            command(['libreoffice', '-env:UserInstallation=' + profile.as_uri(), '--headless',
                     '--convert-to', fmt, '--outdir', str(destination), str(input_path)], env=env)
            require((destination / (key + '.' + fmt)).is_file(), 'Office conversion produced no output.')
        native = json.loads(command(['node', str(ROOT / 'scripts/check-office-import.mjs'),
                                     str(case_output / 'resaved' / (key + '.' + exchange_format)), key]))
        documents = [fitz.open(case_output / folder / (key + '.pdf')) for folder in ['source-pdf', 'resaved-pdf', *(['normalized-pdf'] if spec.get('normalize') and exchange_format == 'odt' else [])]]
        for document in documents:
            require(['landscape' if page.rect.width > page.rect.height else 'portrait' for page in document] == spec['pages'],
                    'Office page count/orientations changed.')
        pages = []
        for page_index, a in enumerate(documents[0]):
            checks = []
            for companion in documents[1:]:
                b = companion[page_index]
                require(abs(a.rect.width - b.rect.width) < .1 and abs(a.rect.height - b.rect.height) < .1,
                        'Office paper dimensions changed.')
                require(' '.join(a.get_text().split()) == ' '.join(b.get_text().split()), 'Office text/page placement changed.')
                left, right = [page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False) for page in [a, b]]
                identical = left.width == right.width and left.height == right.height and left.samples == right.samples
                if spec['pixel_identical']:
                    require(identical, 'Office 144-DPI render changed; retained PDFs need review.')
                checks.append(identical)
            pages.append({'width_points': a.rect.width, 'height_points': a.rect.height, 'pixel_identical': all(checks)})
        return {'input': spec['input'], 'exchange_format': exchange_format, 'render_reference': 'generated-docx' if exchange_format == 'docx' else 'original-odt', 'odf13_parts_verified': validated_parts, 'native_import': native, 'pages': pages}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--case', default='all')
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    cases = select_cases(json.loads(MANIFEST.read_text()), args.case)
    output = Path(args.output).resolve()
    output.mkdir(parents=True, exist_ok=False)
    report = {'source': os.environ.get('GITHUB_SHA'), 'libreoffice': command(['libreoffice', '--version']).strip(), 'cases': {}}
    try:
        for key, spec in cases.items():
            report['cases'][key] = run_case(key, spec, output)
    finally:
        (output / 'office-report.json').write_text(json.dumps(report, indent=2) + '\n')
    text = '## Office exchange probes passed\n\n' + report['libreoffice'] + '\n\n' + str(len(cases)) + ' actual editor round trips passed native import, ODF schema, text/page geometry and declared render checks. PDFs and JSON are attached.\n'
    print(text)
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as file:
            file.write(text)


if __name__ == '__main__':
    main()
