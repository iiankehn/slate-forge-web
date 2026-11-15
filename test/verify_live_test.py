import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('live', Path(__file__).parents[1] / 'scripts/verify-live.py')
live = importlib.util.module_from_spec(spec)
spec.loader.exec_module(live)


class LiveVerificationTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.site = Path(temporary.name)
        self.files = {'index.html': b'shell', 'app.js': b'app', 'pdf-workspace.js': b'pdf',
                      'ocr-workspace.js': b'ocr', 'semantic-worker.js': b'semantic'}
        assets = ['./app.js']
        optional = ['./pdf-workspace.js', './ocr-workspace.js', './semantic-worker.js']
        digest = hashlib.sha256(b''.join(self.files[name.removeprefix('./')] for name in ['index.html', *assets, *optional])).hexdigest()[:16]
        self.files['sw.js'] = ('const ASSETS=' + json.dumps(assets) + ';const OPTIONAL=' + json.dumps(optional) +
                               ";const ROOT='x';const CACHE=PREFIX+'" + digest + "';").encode()
        self.metadata = {'source': 'a' * 40, 'archive_sha256': 'b' * 64, 'ci_run': 1, 'artifact_id': 2,
                         'files': {name: {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
                                   for name, data in self.files.items()}}
        for name, data in self.files.items():
            (self.site / name).write_bytes(data)

    def test_exact_site_and_worker_bytes_are_verified(self):
        result = live.verify(self.site, self.metadata, self.files.__getitem__)
        self.assertTrue(result['live_exact_artifact_match'])
        self.assertEqual(result['live_assets_verified'], 6)
        self.assertEqual(result['artifact_id'], 2)

    def test_tampered_candidate_is_refused_before_network(self):
        (self.site / 'app.js').write_bytes(b'changed')
        calls = []
        with self.assertRaisesRegex(ValueError, 'digest differs'):
            live.verify(self.site, self.metadata, lambda name: calls.append(name))
        self.assertEqual(calls, [])

    def test_wrong_live_bytes_cannot_be_claimed_as_verified(self):
        with self.assertRaisesRegex(ValueError, 'Live bytes differ'):
            live.verify(self.site, self.metadata, lambda name: b'wrong')

    def test_missing_extra_and_symlinked_files_are_refused(self):
        (self.site / 'extra').write_bytes(b'extra')
        with self.assertRaises(ValueError):
            live.verified_site(self.site, self.metadata)
        (self.site / 'extra').unlink()
        (self.site / 'app.js').unlink()
        (self.site / 'app.js').symlink_to(self.site / 'index.html')
        with self.assertRaises(ValueError):
            live.verified_site(self.site, self.metadata)

    def test_unsafe_worker_paths_and_bad_provenance_are_refused(self):
        for path in ['../escape', '/absolute', 'https://other.example/a', 'a\\b', 'a/../b']:
            with self.assertRaises(ValueError):
                live.name(path)
        self.metadata['source'] = 'not-a-commit'
        with self.assertRaises(ValueError):
            live.verified_site(self.site, self.metadata)

    def test_worker_cache_mismatch_is_refused_even_with_a_matching_file_manifest(self):
        self.files['sw.js'] = self.files['sw.js'].replace(b"PREFIX+'", b"PREFIX+'0", 1)
        (self.site / 'sw.js').write_bytes(self.files['sw.js'])
        self.metadata['files']['sw.js'] = {'bytes': len(self.files['sw.js']), 'sha256': hashlib.sha256(self.files['sw.js']).hexdigest()}
        with self.assertRaises(ValueError):
            live.verified_site(self.site, self.metadata)


if __name__ == '__main__':
    unittest.main()
