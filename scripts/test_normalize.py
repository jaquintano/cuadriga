"""Comprueba scripts/normalize.py contra los vectores compartidos con Vitest.
Uso: python -m unittest scripts/test_normalize.py
"""
import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from normalize import normalize  # noqa: E402

VECTORS = Path(__file__).resolve().parent.parent / "tests" / "normalize.vectors.json"


class TestNormalize(unittest.TestCase):
    def test_vectors(self):
        for raw, expected in json.loads(VECTORS.read_text(encoding="utf-8")):
            with self.subTest(raw=raw):
                self.assertEqual(normalize(raw), expected)

    def test_idempotent(self):
        for _, expected in json.loads(VECTORS.read_text(encoding="utf-8")):
            self.assertEqual(normalize(expected), expected)


if __name__ == "__main__":
    unittest.main()
