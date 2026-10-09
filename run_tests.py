"""
run_tests.py

Test runner for KrishiNirnay Division 2 Decision, Risk & Economics test suite.
Handles directory paths containing brackets safely.
"""

import os
import sys
import pytest

if __name__ == "__main__":
    curr_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(curr_dir)
    sys.path.insert(0, curr_dir)
    exit_code = pytest.main(["tests", "-v", "--tb=short"])
    sys.exit(exit_code)
