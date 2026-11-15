import copy
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).parents[1]
spec = importlib.util.spec_from_file_location('office', ROOT / 'scripts/office-probes.py')
office = importlib.util.module_from_spec(spec)
spec.loader.exec_module(office)


class OfficeProbeTests(unittest.TestCase):
    def setUp(self):
        self.manifest = json.loads(office.MANIFEST.read_text())

    def test_committed_cases_have_explicit_geometry_and_render_expectations(self):
        cases = office.select_cases(self.manifest, 'all')
        self.assertEqual(len(cases), 4)
        for key, case in cases.items():
            self.assertTrue((ROOT / case['input']).is_file())
            self.assertTrue(case['pixel_identical'])
            self.assertEqual(list(office.select_cases(cases, key)), [key])

    def test_unknown_cases_and_unsafe_paths_are_refused(self):
        with self.assertRaises(ValueError):
            office.select_cases(self.manifest, 'unknown')
        for path in ['../../outside.odt', '/tmp/outside.odt', 'app.mjs']:
            manifest = copy.deepcopy(self.manifest)
            manifest['landscape-ending']['input'] = path
            with self.assertRaises(ValueError):
                office.select_cases(manifest, 'all')

    def test_invalid_page_or_render_expectations_are_refused(self):
        for change in [{'pages': []}, {'pages': ['arbitrary']}, {'pixel_identical': None}]:
            manifest = copy.deepcopy(self.manifest)
            manifest['landscape-ending'].update(change)
            with self.assertRaises(ValueError):
                office.select_cases(manifest, 'all')


if __name__ == '__main__':
    unittest.main()
