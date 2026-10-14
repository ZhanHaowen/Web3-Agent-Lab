"""Package an already built release, reusing verified runtime archives.

python scripts/package-release.py --runtime-dir <previous-release-dir> --output <new-dir>
Never includes data/, credentials, node_modules, or old app code from the runtime archives.
"""
import argparse
import hashlib
import json
import zipfile
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--runtime-dir', required=True, type=Path)
parser.add_argument('--output', required=True, type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
output = args.output.resolve()
output.mkdir(parents=True, exist_ok=True)
build = json.loads((root / 'build-info.json').read_text(encoding='utf-8'))
release = build.get('releaseLabel', build['displayVersion'])
checks = {}
for line in (args.runtime_dir / 'Web3-Agent-Lab-SHA256.txt').read_text(encoding='utf-8-sig').splitlines():
    fields = line.split()
    if len(fields) >= 2:
        checks[fields[-1].lstrip('*')] = fields[0].lower()
def digest(p):
    with p.open('rb') as f:
        return hashlib.file_digest(f, 'sha256').hexdigest()
def add_path(z, path, prefix):
    paths = sorted(path.rglob('*')) if path.is_dir() else [path]
    for item in paths:
        if item.is_file():
            archive_name = prefix + '/' + item.relative_to(root).as_posix()
            if item.suffix in ('.command', '.sh'):
                info = zipfile.ZipInfo(archive_name)
                info.create_system = 3
                info.external_attr = 0o100755 << 16
                info.compress_type = zipfile.ZIP_DEFLATED
                content = item.read_bytes()
                if b'\r' in content:
                    raise RuntimeError('Shell entry must use LF line endings: ' + str(item))
                z.writestr(info, content)
            else:
                z.write(item, archive_name)
def current(z, prefix, source=False):
    names = ['src','public','contracts','scripts','tests','.github','docs','examples','licenses'] if source else ['public','contracts','scripts','docs','examples','licenses']
    names += ['package.json','pnpm-lock.yaml','pnpm-workspace.yaml','README.md','LICENSE','THIRD_PARTY_NOTICES.md','build-info.json','start.cmd','stop.cmd','Start.command','Stop.command']
    if source: names += ['tsconfig.json','.gitignore','.gitattributes']
    for name in names:
        p = root / name
        if p.exists(): add_path(z, p, prefix)
    if not source:
        for name in ['server.mjs','cli.mjs']: add_path(z, root/'dist'/name, prefix)
    for manual in sorted(output.glob('*.docx')):
        z.write(manual, prefix + '/' + manual.name)
archives = []
for platform in ['Windows-x64','macOS']:
    original = args.runtime_dir / f'Web3-Agent-Lab-{platform}.zip'
    if checks.get(original.name) != digest(original): raise RuntimeError('Runtime archive checksum mismatch: ' + original.name)
    prefix = f'Web3-Agent-Lab-{release}-{platform}'
    target = output / (prefix + '.zip')
    with zipfile.ZipFile(original) as old, zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        current(z, prefix)
        for info in old.infolist():
            relative = info.filename.split('/',1)[-1]
            if not info.is_dir() and (relative.startswith('runtime/') or relative == 'runtime-provenance.json'):
                copied = zipfile.ZipInfo(prefix + '/' + relative)
                copied.external_attr = info.external_attr
                copied.compress_type = zipfile.ZIP_DEFLATED
                z.writestr(copied, old.read(info))
    archives.append(target)
source = output / f'Web3-Agent-Lab-{release}-Source.zip'
with zipfile.ZipFile(source,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    current(z, f'Web3-Agent-Lab-{release}-Source', source=True)
    bundle = output / 'repository.bundle'
    if bundle.exists(): z.write(bundle,f'Web3-Agent-Lab-{release}-Source/repository.bundle')
archives.append(source)
for p in sorted(output.glob('*.docx')): archives.append(p)
(output / f'Web3-Agent-Lab-{release}-SHA256.txt').write_text(''.join(digest(p)+'  '+p.name+'\n' for p in archives),encoding='utf-8')
print(json.dumps({'version':release,'sourceHash':build['sourceHash'],'archives':[{'file':p.name,'bytes':p.stat().st_size} for p in archives]},indent=2))
