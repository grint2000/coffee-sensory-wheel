#!/usr/bin/env python3
"""Reject credential literals without printing their values.

The single public Firebase browser configuration key has a path-bound exception
identified by SHA-256. Provider restrictions are separate from this source scan;
see SECURITY.md for the verification scope. Revisit this exception on rotation.
"""
import hashlib
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
LEGACY_PUBLIC_KEY = ('team.js', '4cb1623a4237b17c3f4749c4d7f9d89a74117ce02306148b3615e26afe2c1ab3')
PATTERNS = {
    'Google API key': re.compile(r'(?<![A-Za-z0-9_-])AIza[A-Za-z0-9_-]{35}(?![A-Za-z0-9_-])'),
    'GitHub token': re.compile(r'\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{60,})\b'),
    'AWS access key': re.compile(r'\b(?:AKIA|ASIA)[A-Z0-9]{16}\b'),
    'private key': re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----'),
}

def findings(path, content):
    result = []
    for kind, pattern in PATTERNS.items():
        for match in pattern.finditer(content):
            digest = hashlib.sha256(match.group().encode()).hexdigest()
            if kind == 'Google API key' and (path, digest) == LEGACY_PUBLIC_KEY:
                continue
            result.append((path, content.count('\n', 0, match.start()) + 1, kind))
    return result

def main():
    paths = subprocess.check_output(['git', 'ls-files', '--cached', '--others', '--exclude-standard', '-z'], cwd=ROOT).decode().split('\0')
    errors, legacy = [], False
    for name in dict.fromkeys(paths):
        path = ROOT / name
        if not name or not path.is_file():
            continue
        if (path.name == '.env' or path.name.startswith('.env.')) and path.suffix not in ['.example', '.sample']:
            errors.append((name, 1, 'environment file'))
        try:
            content = path.read_text()
        except UnicodeError:
            continue
        errors.extend(findings(name, content))
        if name == LEGACY_PUBLIC_KEY[0]:
            legacy = any(hashlib.sha256(m.group().encode()).hexdigest() == LEGACY_PUBLIC_KEY[1]
                         for m in PATTERNS['Google API key'].finditer(content))
    for path, line, kind in errors:
        print(f'{path}:{line}: blocked {kind} (value redacted)', file=sys.stderr)
    if legacy:
        print('NOTICE: one reviewed public Firebase browser configuration key is allowed at its existing path; provider restriction checks are documented in SECURITY.md.', file=sys.stderr)
    if errors:
        return 1
    print('Credential scan passed: no new credential literals detected.')
    return 0

if __name__ == '__main__':
    sys.exit(main())
