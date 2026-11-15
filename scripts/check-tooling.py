#!/usr/bin/env python3
"""Run every Python tooling-policy test, including legacy hyphenated names."""
import importlib.util
from pathlib import Path
import unittest

suite = unittest.TestSuite()
for path in sorted((Path(__file__).resolve().parents[1] / 'test').glob('*_test.py')):
    spec = importlib.util.spec_from_file_location(path.stem.replace('-', '_'), path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    suite.addTests(unittest.defaultTestLoader.loadTestsFromModule(module))
raise SystemExit(not unittest.TextTestRunner(verbosity=2).run(suite).wasSuccessful())
