import copy
import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).parents[1]
spec = importlib.util.spec_from_file_location('ci_plan', ROOT / 'scripts/ci_plan.py')
plan = importlib.util.module_from_spec(spec)
spec.loader.exec_module(plan)


class CIPlanTests(unittest.TestCase):
    def test_only_documentation_is_eligible_for_skipping_runtime(self):
        self.assertTrue(plan.documentation_only(['AGENTS.md', 'docs/ROADMAP.md', 'docs/ui/example.png']))
        for paths in [[], ['docs/fixtures/input.odt'], ['src/editor.mjs'], ['new-source.py'], ['docs/helper.mjs'], ['unknown.md'],
                      ['.github/workflows/ci.yml'], ['docs/ROADMAP.md', 'test/check.test.mjs']]:
            with self.subTest(paths=paths):
                self.assertFalse(plan.documentation_only(paths))

        self.assertTrue(plan.requires_runtime(['README.md'], 'push', reliable=False))
        self.assertTrue(plan.requires_runtime(['README.md'], 'workflow_dispatch'))
        self.assertFalse(plan.requires_runtime(['README.md'], 'push'))

    def needs(self, runtime=True):
        return {'plan': {'result': 'success', 'outputs': {'runtime': str(runtime).lower()}},
                **{name: {'result': 'success' if runtime else 'skipped'}
                   for name in ['build', 'node', 'tooling', 'browser', 'office']}}

    def test_every_runtime_stage_must_pass(self):
        self.assertTrue(plan.gate(self.needs()))
        for stage in ['plan', 'build', 'node', 'tooling', 'browser', 'office']:
            for result in ['failure', 'cancelled', 'skipped', None]:
                needs = self.needs()
                needs[stage]['result'] = result
                with self.subTest(stage=stage, result=result), self.assertRaises(ValueError):
                    plan.gate(needs)
        missing = self.needs()
        del missing['browser']
        with self.assertRaises(ValueError):
            plan.gate(missing)

    def test_documentation_gate_requires_explicit_completed_planning(self):
        self.assertFalse(plan.gate(self.needs(False)))
        for runtime in ['', None, 'unknown']:
            needs = self.needs(False)
            needs['plan']['outputs']['runtime'] = runtime
            with self.assertRaises(ValueError):
                plan.gate(needs)
        needs = self.needs(False)
        needs['browser']['result'] = 'failure'
        with self.assertRaises(ValueError):
            plan.gate(needs)

    def test_workflow_keeps_five_profiles_one_build_and_a_stable_required_gate(self):
        workflow = (ROOT / '.github/workflows/ci.yml').read_text()
        for profile in ['desktop-chromium', 'desktop-firefox', 'desktop-webkit', 'phone-chromium', 'phone-webkit']:
            self.assertIn(profile, workflow)
        self.assertEqual(workflow.count('run: npm run build'), 1)
        self.assertIn('needs: [plan, build, node, tooling, browser, office]', workflow)
        self.assertIn('cancel-in-progress:', workflow)
        self.assertIn('fail-fast: false', workflow)
        self.assertIn('browser-results-${{ matrix.project }}', workflow)
        self.assertIn('failOnFlakyTests:!!process.env.CI', (ROOT / 'playwright.config.mjs').read_text())


if __name__ == '__main__':
    unittest.main()
