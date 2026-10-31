import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('secret_scan', Path(__file__).resolve().parents[1] / 'scripts/check-secrets.py')
scan = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scan)

class SecretScanTests(unittest.TestCase):
    def test_new_google_key_is_blocked_even_in_team_source(self):
        self.assertEqual(scan.findings('team.js', '\n' + 'AIza' + 'x' * 35), [('team.js', 2, 'Google API key')])

    def test_legacy_key_is_only_allowed_at_its_existing_path(self):
        source = (scan.ROOT / 'team.js').read_text()
        self.assertFalse(scan.findings('team.js', source))
        self.assertTrue(scan.findings('copied-config.js', source))

    def test_private_keys_and_tokens_are_blocked_without_echoing_values(self):
        for secret in ['ghp_' + 'x' * 36, 'AKIA' + 'X' * 16, '-----BEGIN ' + 'PRIVATE KEY-----']:
            result = scan.findings('config.js', secret)
            self.assertTrue(result)
            self.assertNotIn(secret, str(result))

if __name__ == '__main__':
    unittest.main()
