import copy
import hashlib
import importlib.util
from pathlib import Path
import stat
import tempfile
import unittest
import warnings
import zipfile

spec = importlib.util.spec_from_file_location('promotion', Path(__file__).parents[1] / 'scripts/promote-pages.py')
promotion = importlib.util.module_from_spec(spec)
spec.loader.exec_module(promotion)
REPO = 'iiankehn/slate-forge-web'
SHA = 'a' * 40


class PromotionTests(unittest.TestCase):
    def setUp(self):
        self.run = {'id': 12, 'repository': {'full_name': REPO}, 'head_repository': {'full_name': REPO},
                    'workflow_id': 34, 'event': 'push', 'head_branch': 'main', 'head_sha': SHA,
                    'status': 'completed', 'conclusion': 'success'}
        self.workflow = {'id': 34}
        self.jobs = {'jobs': [{'name': 'verify', 'status': 'completed', 'conclusion': 'success'}]}
        self.comparison = {'status': 'ahead'}
        self.artifact = {'id': 56, 'name': 'static-site', 'expired': False, 'size_in_bytes': 100,
                         'digest': 'sha256:' + 'b' * 64, 'workflow_run': {'id': 12, 'head_sha': SHA}}
        self.artifacts = {'total_count': 1, 'artifacts': [self.artifact]}
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)

    def selected(self):
        return promotion.select_artifact(REPO, self.run, self.workflow, self.jobs, self.comparison, self.artifacts)

    def bundle(self, extra=None, omit=None):
        archive = self.root / 'site.zip'
        with zipfile.ZipFile(archive, 'w') as bundle:
            for name in promotion.REQUIRED - set(omit or []):
                bundle.writestr(name, 'exact verified bytes: ' + name)
            bundle.writestr('.nojekyll', '')
            bundle.writestr('chunks/picture.bin', b'\x00\x01\xff')
            if extra:
                extra(bundle)
        digest = 'sha256:' + hashlib.sha256(archive.read_bytes()).hexdigest()
        return archive, digest

    def test_successful_main_artifact_can_be_promoted_without_rebuilding(self):
        self.assertEqual(self.selected()['id'], 56)
        archive, digest = self.bundle()
        output = self.root / 'release'
        self.assertEqual(promotion.extract_verified(archive, digest, output), digest[7:])
        self.assertEqual((output / 'app.js').read_text(), 'exact verified bytes: app.js')
        self.assertEqual((output / 'chunks/picture.bin').read_bytes(), b'\x00\x01\xff')
        self.assertTrue((output / '.nojekyll').exists())
        self.comparison['status'] = 'identical'
        self.assertEqual(self.selected()['id'], 56)

    def test_wrong_run_event_source_workflow_and_failed_checks_are_refused(self):
        original = copy.deepcopy(self.run)
        for key, value in [('event', 'pull_request'), ('event', 'workflow_dispatch'), ('head_branch', 'feature'),
                           ('workflow_id', 99), ('status', 'in_progress'), ('conclusion', 'failure'),
                           ('conclusion', 'cancelled'), ('head_sha', 'not-a-sha'),
                           ('head_repository', {'full_name': 'fork/slate-forge-web'})]:
            with self.subTest(key=key, value=value):
                self.run = copy.deepcopy(original)
                self.run[key] = value
                with self.assertRaises(ValueError):
                    self.selected()
        self.run = original
        for conclusion in ['skipped', 'failure', None]:
            self.jobs['jobs'][0]['conclusion'] = conclusion
            with self.assertRaises(ValueError):
                self.selected()
        self.jobs = {'jobs': []}
        with self.assertRaises(ValueError):
            self.selected()

    def test_unreachable_source_and_ambiguous_expired_or_unbound_artifacts_are_refused(self):
        for status in ['behind', 'diverged', None]:
            self.comparison['status'] = status
            with self.assertRaises(ValueError):
                self.selected()
        self.comparison['status'] = 'ahead'
        original = copy.deepcopy(self.artifact)
        for change in [{'expired': True}, {'digest': None}, {'size_in_bytes': promotion.MAX_TOTAL + 1},
                       {'workflow_run': {'id': 13, 'head_sha': SHA}},
                       {'workflow_run': {'id': 12, 'head_sha': 'c' * 40}}]:
            self.artifacts['artifacts'] = [{**original, **change}]
            with self.assertRaises(ValueError):
                self.selected()
        for entries in [[], [original, original]]:
            self.artifacts['artifacts'] = entries
            with self.assertRaises(ValueError):
                self.selected()

    def test_digest_mismatch_never_extracts_files(self):
        archive, digest = self.bundle()
        with archive.open('ab') as file:
            file.write(b'tamper')
        output = self.root / 'release'
        with self.assertRaisesRegex(ValueError, 'digest mismatch'):
            promotion.extract_verified(archive, digest, output)
        self.assertFalse(output.exists())

    def test_unsafe_archive_entries_never_create_an_output_directory(self):
        for name in ['../escape', '/absolute', 'a\\escape', 'C:/escape', '.openai/config', '.env.secret', 'a/../escape']:
            with self.subTest(name=name):
                archive, digest = self.bundle(lambda bundle: bundle.writestr(name, 'bad'))
                output = self.root / 'release'
                with self.assertRaises(ValueError):
                    promotion.extract_verified(archive, digest, output)
                self.assertFalse(output.exists())
        def symlink(bundle):
            entry = zipfile.ZipInfo('link')
            entry.create_system = 3
            entry.external_attr = (stat.S_IFLNK | 0o777) << 16
            bundle.writestr(entry, '../outside')
        archive, digest = self.bundle(symlink)
        with self.assertRaises(ValueError):
            promotion.extract_verified(archive, digest, self.root / 'release')

    def test_duplicate_collision_incomplete_or_oversized_sites_are_refused(self):
        with warnings.catch_warnings():
            warnings.simplefilter('ignore', UserWarning)
            archive, digest = self.bundle(lambda bundle: bundle.writestr('app.js', 'replacement'))
        with self.assertRaises(ValueError):
            promotion.extract_verified(archive, digest, self.root / 'release')
        archive, digest = self.bundle(lambda bundle: (bundle.writestr('file', 'x'), bundle.writestr('file/child', 'x')))
        with self.assertRaises(ValueError):
            promotion.extract_verified(archive, digest, self.root / 'release')
        archive, digest = self.bundle(omit=['sw.js'])
        with self.assertRaises(ValueError):
            promotion.extract_verified(archive, digest, self.root / 'release')
        archive, digest = self.bundle()
        old = promotion.MAX_FILE
        try:
            promotion.MAX_FILE = 1
            with self.assertRaises(ValueError):
                promotion.extract_verified(archive, digest, self.root / 'release')
        finally:
            promotion.MAX_FILE = old

    def test_pages_workflow_contains_promotion_and_no_build_or_browser_commands(self):
        workflow = (Path(__file__).parents[1] / '.github/workflows/pages.yml').read_text()
        self.assertIn('scripts/promote-pages.py', workflow)
        self.assertIn('verification_run_id', workflow)
        for command in ['npm ci', 'npm run build', 'npm run test:browser']:
            self.assertNotIn(command, workflow)


if __name__ == '__main__':
    unittest.main()
