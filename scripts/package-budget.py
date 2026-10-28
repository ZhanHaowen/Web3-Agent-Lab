"""Package the research release without runtime data or credentials."""
from pathlib import Path, PurePosixPath
import argparse
import hashlib
import json
import os
import re
import zipfile

EXCLUDED_DIRS = {
    ".git", "node_modules", "__pycache__",
    "pnpm-store", ".pnpm-store", ".pnpm", ".codex", ".agents",
    ".cache", ".pytest_cache", ".mypy_cache", ".ruff_cache",
}
SECRET_NAMES = {
    "wallet-secret.json", "model-secret.json", "identity.token",
    "control-admin.token", "secrets.json", "credentials.json",
    "private-key.json", "privatekey.json",
}
PRIVATE_SUFFIXES = (".key", ".pem", ".p12", ".pfx", ".token")
DATABASE_NAME = re.compile(r"\.(?:sqlite3?|db3?)(?:$|[.-])")


def allowed_relative(relative):
    """One deny policy for both source selection and archive verification."""
    if relative.is_absolute() or any(part in {"", ".", ".."} for part in relative.parts):
        return False
    parts = tuple(part.lower() for part in relative.parts)
    if not parts:
        return False
    directories = parts[:-1]
    if directories and directories[0] in {"artifacts", "build"}:
        return False
    if any(part.startswith("data") or part in EXCLUDED_DIRS for part in directories):
        return False
    if any(parts[index:index + 2] == ("runtime", "download") for index in range(len(parts) - 1)):
        return False
    name = parts[-1]
    return not (
        name in SECRET_NAMES
        or name == ".env"
        or name.startswith(".env.")
        or name.endswith(PRIVATE_SUFFIXES)
        or name.endswith((".log", ".log.gz", ".pyc", ".zip"))
        or DATABASE_NAME.search(name)
    )


def local_link(path):
    """Do not traverse symlinks or Windows junction/reparse-point directories."""
    try:
        return path.is_symlink() or bool(getattr(path.lstat(), "st_file_attributes", 0) & 0x400)
    except OSError:
        return True


def eligible(path, root, output=None):
    try:
        relative = path.relative_to(root)
    except ValueError:
        return False
    if not allowed_relative(relative) or local_link(path) or not path.is_file():
        return False
    if output is not None and path.resolve() in {output, output.with_suffix(".sha256.txt")}:
        return False
    return True


def release_files(root, output):
    # Prune ignored trees before descending; pnpm stores and data folders can be huge.
    found = []
    for directory, directories, filenames in os.walk(root, topdown=True, followlinks=False):
        parent = Path(directory)
        directories[:] = [
            name for name in directories
            if allowed_relative((parent / name).relative_to(root) / "__directory_probe__")
            and not local_link(parent / name)
        ]
        for name in filenames:
            path = parent / name
            if path.name != "release-manifest.json" and eligible(path, root, output):
                found.append(path)
    return sorted(found)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    root = Path(__file__).resolve().parent.parent
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    required_files = ("runtime/node.exe", "runtime/anvil.exe", "dist/server.mjs")
    for required in required_files:
        if not (root / required).is_file():
            raise SystemExit(
                "Portable Windows package requires " + required
                + ". Prepare the runtime first; this is not a source-only packager."
            )
    output = Path(args.output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    label = "Web3-Agent-Lab-V0.15.3-Windows-x64"
    files = release_files(root, output)
    selected = {path.relative_to(root).as_posix() for path in files}
    if not set(required_files).issubset(selected):
        raise SystemExit("Required portable runtime/entry files were excluded or are local links.")
    build = json.loads((root / "build-info.json").read_text(encoding="utf-8-sig"))
    manifest = {
        "release": label,
        "buildHash": build["sourceHash"],
        "files": {
            path.relative_to(root).as_posix(): {
                "sha256": digest(path),
                "bytes": path.stat().st_size,
            }
            for path in files
        },
    }
    manifest_path = root / "release-manifest.json"
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    files.append(manifest_path)
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for path in sorted(files):
            archive.write(path, label + "/" + path.relative_to(root).as_posix())
    with zipfile.ZipFile(output) as archive:
        assert archive.testzip() is None
        expected_names = {label + "/" + name for name in manifest["files"]}
        expected_names.add(label + "/release-manifest.json")
        assert set(archive.namelist()) == expected_names, "Unexpected or missing archive entries"
        for name in archive.namelist():
            assert name.startswith(label + "/"), name
            relative = PurePosixPath(name[len(label) + 1:])
            assert allowed_relative(relative), "Forbidden archive entry: " + name
        for name, entry in manifest["files"].items():
            contents = archive.read(label + "/" + name)
            assert len(contents) == entry["bytes"], name
            assert hashlib.sha256(contents).hexdigest() == entry["sha256"], name
        assert json.loads(archive.read(label + "/release-manifest.json")) == manifest
    checksum = digest(output)
    output.with_suffix(".sha256.txt").write_text(
        checksum + "  " + output.name + "\n", encoding="ascii"
    )
    print(json.dumps({
        "zip": str(output), "files": len(files), "bytes": output.stat().st_size,
        "sha256": checksum, "buildHash": build["sourceHash"],
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
