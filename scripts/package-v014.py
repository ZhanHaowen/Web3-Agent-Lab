"""Package V0.15.1 without runtime data, private material or build diagnostics."""
from pathlib import Path
import hashlib
import json
import sys
import zipfile

RELEASE_VERSION = 'V0.15.1'
EXCLUDED_DIRS = {'build', 'tools', 'node_modules', '.git', '__pycache__'}
SECRET_NAMES = {
    'wallet-secret.json', 'model-secret.json', 'secrets.json',
    'identity.token', 'control-admin.token', 'credentials.json',
}


def allowed_relative(relative):
    """Apply the same deny rules before packaging and to archive entries."""
    parts = relative.parts
    if any(p.lower() in EXCLUDED_DIRS or p.lower().startswith('data') for p in parts[:-1]):
        return False
    name = parts[-1].lower()
    return not (
        name in SECRET_NAMES
        or name.startswith('.env')
        or name.endswith(('.key', '.pem', '.p12', '.pfx', '.token'))
        or name == 'release-manifest.json'
    )


def included(path, root, output):
    return (
        path.is_file()
        and not path.is_symlink()
        and path.resolve() not in {output, output.with_suffix('.sha256.txt')}
        and allowed_relative(path.relative_to(root))
    )


def main():
    root = Path(__file__).resolve().parents[1]
    output = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else root.parent / (root.name + '.zip')
    paths = sorted(p for p in root.rglob('*') if included(p, root, output))
    assert (root / 'contracts/artifacts/LabPeerExchange.json').is_file(), 'Compile the exchange first'
    assert (root / 'contracts/artifacts/LabServiceEscrow.json').is_file(), 'Compile the service escrow first'
    build = json.loads((root / 'build-info.json').read_text(encoding='utf-8-sig'))
    assert build.get('displayVersion') == RELEASE_VERSION, 'Build the V0.15.1 release first'
    for relative, expected in build['files'].items():
        assert hashlib.sha256((root / relative).read_bytes()).hexdigest() == expected, 'Stale build: ' + relative
    manifest = {
        'version': RELEASE_VERSION,
        'releaseRevision': build.get('releaseRevision'),
        'acceptanceStatus': 'NOT_FULLY_ACCEPTED',
        'platform': 'windows-x64',
        'sourceHash': build['sourceHash'],
        'files': {},
    }
    for path in paths:
        data = path.read_bytes()
        manifest['files'][path.relative_to(root).as_posix()] = {
            'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data),
        }
    (root / 'release-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for path in paths + [root / 'release-manifest.json']:
            archive.write(path, root.name + '/' + path.relative_to(root).as_posix())
    with zipfile.ZipFile(output) as archive:
        assert archive.testzip() is None
        names = [Path(name).relative_to(root.name) for name in archive.namelist()]
        assert all(name.as_posix() == 'release-manifest.json' or allowed_relative(name) for name in names)
    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    output.with_suffix('.sha256.txt').write_text(digest + '  ' + output.name + '\n', encoding='ascii')
    print(json.dumps({'file': str(output), 'bytes': output.stat().st_size, 'sha256': digest, 'entries': len(paths) + 1}))


if __name__ == '__main__':
    main()
