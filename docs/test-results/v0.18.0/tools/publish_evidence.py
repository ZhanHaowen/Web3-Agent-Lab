"""Publish selected, explicitly redacted local acceptance evidence (stdlib only).

Usage: python publish_evidence.py --workspace PATH [--include-release]
The source experiments remain untouched. This is an evidence publication helper,
not an experiment runner. A completed release run is required by --include-release.
"""
from __future__ import annotations
import argparse
import csv
import hashlib
import io
import json
import os
import re
import sys
import zipfile
from pathlib import Path

def long_path(path):
    value = str(Path(path).resolve())
    if os.name == "nt" and not value.startswith("\\\\?\\"):
        value = "\\\\?\\UNC\\" + value[2:] if value.startswith("\\\\") else "\\\\?\\" + value
    return Path(value)


OUT = long_path(Path(__file__).resolve().parent.parent)
DENIED = {"data", "isolated", "fixture", "model-data", "runtime", "node_modules", ".git", "wallets", "secrets", "keys"}
SUFFIXES = {".json", ".jsonl", ".log", ".txt", ".csv", ".graphml", ".md"}
SECRET_FIELDS = {"privatekey", "walletprivatekey", "privatekeys", "mnemonic", "seedphrase", "apikey", "apitoken", "accesstoken", "refreshtoken", "clientsecret", "password", "csrftoken", "admintoken", "sessiontoken"}
SAFE_VALUES = {"", "redacted", "[redacted]", "<redacted>", "[secret]", "excluded", "omitted", "none", "null", "not_collected", "not_stored"}
ANSI = re.compile(r"\x1b\[[0-9;]*[A-Za-z]")
RELEASE_HASH = "bb1039fb642b27d9d893158f73e81ad81cceb6c58e9f1ea2f9b45dceb533c5ea"
HISTORY_ZIP = "historical-v017-preview-samples.zip"
RELEASE_ZIP = "release-v018-testnet-samples.zip"


def digest(data):
    return hashlib.sha256(data).hexdigest()


def js(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def safe_name(name):
    return bool(name) and not name.startswith(("/", "\\")) and ":" not in name and all(x not in {"", ".", ".."} for x in name.replace("\\", "/").split("/"))


def excluded(name):
    if not safe_name(name):
        return True
    for part in name.lower().replace("\\", "/").split("/"):
        if part in DENIED or part.startswith(("isolated-", "data-")) or part.endswith("-data"):
            return True
        if re.search(r"wallet[-_]secret|model[-_]secret|private[-_]?key|mnemonic|seed[-_]?phrase", part):
            return True
        if part == ".env" or part.startswith(".env.") or part.endswith((".token", ".pem", ".key", ".p12", ".pfx", ".keystore")):
            return True
    return False


def inside(path, root):
    try:
        long_path(path).relative_to(long_path(root))
        return True
    except ValueError:
        return False


def check_file(path, root):
    if not inside(path, root):
        raise ValueError("Source path escapes configured evidence root")
    for item in [path, *path.parents]:
        if item.is_symlink() or (hasattr(item, "is_junction") and item.is_junction()):
            raise ValueError("Symbolic links and junctions are not evidence inputs")
        if item == root:
            break
    if not path.is_file():
        raise FileNotFoundError("Required evidence file missing: " + path.name)


def inspect(value, depth=0):
    if depth > 80:
        raise ValueError("Excessive nested evidence")
    if isinstance(value, dict):
        for key, item in value.items():
            normalized = re.sub(r"[-_]", "", str(key).lower())
            if normalized in SECRET_FIELDS and item not in (None, False, ""):
                safe = isinstance(item, str) and (item.strip().lower() in SAFE_VALUES or re.fullmatch(r"\[redacted[^\]]*\]|<redacted[^>]*>|\*+", item.strip().lower()))
                if not safe:
                    raise ValueError("Unredacted sensitive field: " + str(key))
            inspect(item, depth + 1)
    elif isinstance(value, list):
        for item in value:
            inspect(item, depth + 1)
    elif isinstance(value, str):
        text = value.strip()
        if text.startswith(("{", "[")):
            try:
                inner = json.loads(text)
            except ValueError:
                inner = None
            if inner is not None:
                inspect(inner, depth + 1)
        if re.search(r"(?:private[_ -]?key|mnemonic|seed[_ -]?phrase)\s*[:=]\s*[\"']?(?:0x)?[a-fA-F0-9]{64}\b", value, re.I):
            raise ValueError("Possible private key assignment")
        if re.search(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:sk-proj-|sk-ant-)[A-Za-z0-9_-]{16,}", value):
            raise ValueError("Possible private key or provider credential")


def scan(data, name, public=False):
    if Path(name).suffix.lower() not in SUFFIXES:
        return
    text = data.decode("utf-8-sig")
    if name.endswith(".json"):
        inspect(json.loads(text))
    elif name.endswith(".jsonl"):
        for line in text.splitlines():
            if line.strip():
                inspect(json.loads(line))
    else:
        inspect(text)
        for line in text.splitlines():
            if line.strip().startswith("{"):
                try:
                    value = json.loads(line)
                except ValueError:
                    continue
                inspect(value)
    if public:
        if re.search(r"\b[A-Za-z]:(?:\\+|/)|/(?:home|Users)/[A-Za-z0-9_.-]+/", text):
            raise ValueError("Absolute local path remains in public artifact")
        if re.search(r"(?:Administrator\.)?DESKTOP-[A-Z0-9-]+|ADMINI~\d+\.[A-Z0-9]+", text, re.I):
            raise ValueError("Local account or machine identifier remains")


class Publication:
    def __init__(self, workspace):
        plain_workspace = workspace.resolve()
        self.workspace = long_path(workspace)
        self.files = {}
        self.samples = {}
        self.release_samples = {}
        self.index = []
        self.cases = []
        self.replacements = []
        for path, marker in [(plain_workspace, "__WORKSPACE__"), (Path.home(), "__LOCAL_HOME__")]:
            for spelling in [str(path), path.as_posix()]:
                for _ in range(5):
                    self.replacements.append((spelling, marker))
                    spelling = spelling.replace("\\", "\\\\")
        self.replacements.sort(key=lambda item: len(item[0]), reverse=True)

    def redact(self, data, name):
        if Path(name).suffix.lower() not in SUFFIXES:
            return data
        text = data.decode("utf-8-sig")
        for source, marker in self.replacements:
            text = text.replace(source, marker)
        text = re.sub(r"(?:Administrator\.)?DESKTOP-[A-Z0-9-]+|ADMINI~\d+\.[A-Z0-9]+", "__LOCAL_ACCOUNT__", text, flags=re.I)
        # Other Windows executable/cache locations do not carry experimental data.
        # Redact their whole token; source hashes remain in the publication index.
        text = re.sub(r"\b[A-Za-z]:(?:\\+|/)[^\s\"'<>\r\n,;]*", "__LOCAL_ABSOLUTE_PATH__", text)
        return text.encode("utf-8") if text != data.decode("utf-8-sig") else data

    def add(self, source, target, group, sample=False, source_bytes=None, container_hash=None):
        if not safe_name(target) or excluded(target):
            raise ValueError("Unsafe public destination")
        if source_bytes is None:
            source = long_path(source)
            check_file(source, self.workspace)
            original = source.read_bytes()
            logical = source.relative_to(self.workspace).as_posix()
        else:
            original, logical = source_bytes, str(source)
        scan(original, target)
        public = self.redact(original, target)
        scan(public, target, public=True)
        dest = self.release_samples if sample == "release" else self.samples if sample else self.files
        if target in dest:
            raise ValueError("Duplicate public artifact")
        dest[target] = public
        archive = RELEASE_ZIP if sample == "release" else HISTORY_ZIP
        self.index.append({"publicPath": (archive + "::" if sample else "") + target,
            "source": logical, "evidenceGroup": group,
            "originalLocalSha256": digest(original), "publicSha256": digest(public),
            "originalBytes": len(original), "publicBytes": len(public),
            "redacted": original != public, "sourceContainerSha256": container_hash,
            "transformation": "local-path/account replacement; experimental values and outcomes retained" if original != public else "byte-for-byte unchanged"})
        if not sample:
            self.cases.extend(extract_cases(target, public, group))

    def direct(self, folder, target, group, suffixes=None):
        for path in sorted(folder.iterdir()):
            if path.is_file() and path.suffix.lower() in (suffixes or SUFFIXES) and not excluded(path.name):
                self.add(path, target + "/" + path.name, group)

    def bundle(self, source, target):
        check_file(source, self.workspace)
        raw = source.read_bytes()
        bundle = json.loads(raw.decode("utf-8-sig"))
        for name, content in sorted(bundle["files"].items()):
            if excluded(name):
                raise ValueError("Unexpected excluded file in source bundle")
            if not isinstance(content, str):
                raise ValueError("Bundle file must be original text")
            logical = source.relative_to(self.workspace).as_posix() + "::" + name
            self.add(logical, target + "/" + name, "historical-v017-preview", True, content.encode("utf-8"), digest(raw))

    def validate_sample_manifest(self, folder, manifest_name, target, release=False):
        manifest = json.loads((folder / manifest_name).read_text("utf-8-sig"))
        published = self.release_samples if release else self.samples
        for name, expected in manifest["files"].items():
            if excluded(name) or target + "/" + name not in published:
                raise ValueError("A sealed source file was omitted from the public sample: " + name)
            original = (folder / name).read_bytes()
            if digest(original) != expected["sha256"] or len(original) != expected["bytes"]:
                raise ValueError("Source sample differs from its sealed integrity manifest: " + name)


def extract_cases(source, data, group):
    rows = []
    def add(name, record, location):
        status = record.get("taskStatus", record.get("status", "passed" if record.get("passed") is True else "failed" if record.get("passed") is False else "recorded"))
        rows.append({"evidence_group": group, "test_name": name, "status": status, "platform_pass": record.get("platformPass", ""), "source": source, "location": location})
    if source.endswith(".json") and re.search(r"(?:report|result|summary|regression)[^/]*\.json$", source):
        obj = json.loads(data.decode("utf-8-sig"))
        for key in ["tests", "results", "cases"]:
            for n, item in enumerate(obj.get(key, [])):
                if not isinstance(item, dict):
                    continue
                name = item.get("name", item.get("case", item.get("taskId")))
                if not name and "family" in item and "scheme" in item:
                    name = item["family"] + " / " + item["scheme"]
                    item = {**item, "taskStatus": item.get("summary", {}).get("taskOutcome", "recorded")}
                if isinstance(name, str):
                    add(name, item, "/" + key + "/" + str(n))
    if source.endswith((".log", ".txt")):
        for n, line in enumerate(data.decode("utf-8-sig").splitlines(), 1):
            line = ANSI.sub("", line).strip()
            m = re.match(r"^(PASS|FAIL|SKIP|BLOCKED)\s+(.+)$", line)
            if m:
                add(m[2], {"status": m[1].lower()}, "line " + str(n))
                continue
            m = re.match(r"^([✔✓✖✗])\s+(.+?)(?:\s+\([\d.]+(?:ms|s)\))?$", line)
            if m:
                add(m[2], {"passed": m[1] in "✔✓"}, "line " + str(n))
                continue
            m = re.match(r"^(not ok|ok)\s+\d+\s*-\s*(.+)$", line)
            if m:
                add(m[2], {"status": "skipped" if "# SKIP" in line.upper() else "passed" if m[1] == "ok" else "failed"}, "line " + str(n))
                continue
            if line.startswith("{"):
                try:
                    record = json.loads(line)
                except ValueError:
                    continue
                if isinstance(record, dict) and isinstance(record.get("case"), str):
                    add(record["case"], record, "line " + str(n))
    return rows


def csv_data(rows):
    s = io.StringIO(newline="")
    writer = csv.DictWriter(s, fieldnames=["evidence_group", "test_name", "status", "platform_pass", "source", "location"])
    writer.writeheader()
    for row in rows:
        writer.writerow({k: "'" + v if isinstance(v, str) and v.startswith(("=", "+", "-", "@")) else v for k, v in row.items()})
    return ("\ufeff" + s.getvalue()).encode("utf-8")


def dataset_files(pub, run, target, group):
    log = run / "26-research-dataset.log"
    for line in reversed(log.read_text("utf-8-sig").splitlines()):
        try:
            obj = json.loads(line)
        except ValueError:
            continue
        if isinstance(obj, dict) and isinstance(obj.get("report"), str):
            source = long_path(obj["report"])
            allowed = [pub.workspace / "work/public-web3-agent-lab/artifacts/research-dataset", run / "results"]
            if not any(inside(source, root) for root in allowed) or source.name != "smoke-report.json":
                raise ValueError("Unexpected dataset report path")
            for name in ["smoke-report.json", "private-factor-matrix.json", "private-dataset.json", "private-evaluation.json", "private-negative-controls.json"]:
                pub.add(source.parent / name, target + "/" + name, group)
            return
    raise ValueError("No completed dataset evidence in final log")


def collect(pub, include_release):
    base = pub.workspace / "outputs/testnet-preview-20261116"
    group = "historical-v017-preview"
    pub.direct(base / "full-regression-final-04", "historical/full-regression-final-04", group, {".json", ".log"})
    for attempt in ["full-regression-01", "full-regression-final", "full-regression-final-02", "full-regression-final-03"]:
        folder = base / attempt
        summary = json.loads((folder / "summary.json").read_text("utf-8-sig"))
        pub.add(folder / "summary.json", "historical/failure-history/" + attempt + "/summary.json", group)
        for step in summary["steps"]:
            if step.get("passed") is not True:
                pub.add(folder / (step["name"] + ".log"), "historical/failure-history/" + attempt + "/" + step["name"] + ".log", group)
    for label in ["research-journal-fix", "testnet-gate-race-fix"]:
        pub.direct(base / label, "historical/fixes/" + label, group, {".json", ".log"})
        pub.add(base / label / "integration/report.json", "historical/fixes/" + label + "/integration-report.json", group)
    pub.add(base / "program-identity.json", "historical/program-identity.json", group)
    basic = base / "actual-qwen-final-02"
    pub.add(basic / "report.json", "historical/qwen-basic/report.json", group)
    for task in ["balance", "transfer", "approve", "swap", "swap_deposit"]:
        pub.bundle(basic / (task + ".bundle.json"), "basic/" + task)
        for suffix in ["check.log", "verify.log"]:
            pub.add(basic / (task + "." + suffix), "historical/qwen-basic/" + task + "." + suffix, group)
    research = base / "research-actual-qwen-final"
    pub.add(research / "report.json", "historical/qwen-research/report.json", group)
    for case in ["evidence_review-exact", "risk_analysis-batch", "trend_analysis-erc8183"]:
        folder = research / case
        for path in sorted(folder.rglob("*")):
            name = path.relative_to(folder).as_posix()
            if path.is_file() and path.suffix.lower() in SUFFIXES and not excluded(name):
                pub.add(path, "research/" + case + "/" + name, group, sample=True)
        pub.validate_sample_manifest(folder, "integrity.json", "research/" + case)
    browser = pub.workspace / "outputs/testnet-preview-dev/browser-final-02"
    pub.direct(browser, "historical/gui", group)
    pub.add(browser / "testnet-browser/01-ready-desktop.png", "historical/gui/01-ready-desktop.png", group)
    pub.direct(base / "portable-smoke-final-02", "historical/portable", group, {".log"})
    pub.add(base / "portable-smoke-final-02/report.json", "historical/portable/report.json", group)
    dataset_files(pub, base / "full-regression-final-04", "historical/research-dataset", group)
    if include_release:
        base = pub.workspace / "outputs/v0.18.0-release"
        run = base / "full-regression"
        summary = json.loads((run / "summary.json").read_text("utf-8-sig"))
        if summary.get("passed") is not True or not summary.get("finishedAt") or len(summary.get("steps", [])) != 26 or any(x.get("passed") is not True for x in summary["steps"]):
            raise ValueError("V0.18 release regression has not passed all 26 completed stages")
        if summary.get("build", {}).get("version") != "0.18.0":
            raise ValueError("Release evidence must record the actual 0.18.0 build")
        if summary["build"].get("sourceHash") != RELEASE_HASH:
            raise ValueError("Release build identity differs from the frozen V0.18 evidence selection")
        browser = json.loads((base / "browser/testnet-browser-results.json").read_text("utf-8-sig"))
        if len(browser.get("results", [])) != 15 or any(x.get("passed") is not True for x in browser["results"]) or browser.get("errors"):
            raise ValueError("V0.18 real browser checks have not passed all 15 cases")
        portable = json.loads((base / "portable/report.json").read_text("utf-8-sig"))
        if portable.get("passed") is not True or not portable.get("finishedAt") or portable.get("build", {}).get("version") != "0.18.0":
            raise ValueError("V0.18 portable evidence must be complete and passed on the 0.18.0 build")
        group = "v018-release"
        pub.add(base / "release-identity-proof.json", "release/release-identity-proof.json", group)
        pub.direct(run, "release/full-regression", group, {".json", ".log"})
        for label in ["browser", "portable"]:
            pub.direct(base / label, "release/" + label, group, {".json", ".log", ".txt", ".md"})
        browser_data = base / "browser/testnet-browser"
        run_index = json.loads((browser_data / "runs.json").read_text("utf-8-sig"))
        ids = run_index.get("runIds", [])
        if len(ids) != 7 or len(set(ids)) != 7 or run_index.get("publicNetworkTransactionsSent") is not False:
            raise ValueError("Expected all seven isolated GUI runs, without filtering by outcome")
        pub.add(browser_data / "runs.json", "runs.json", group, sample="release")
        for run_id in ids:
            if not re.fullmatch(r"[a-f0-9-]{36}", run_id):
                raise ValueError("Invalid run identifier")
            config = json.loads((browser_data / "data/testnet/runs" / run_id / "config.json").read_text("utf-8-sig"))
            if config.get("build", {}).get("version") != "0.18.0" or config["build"].get("sourceHash") != RELEASE_HASH:
                raise ValueError("A GUI run does not belong to the frozen V0.18 build")
            for kind in ["runs", "derived"]:
                folder = browser_data / "data/testnet" / kind / run_id
                if not folder.is_dir():
                    raise ValueError("Missing raw or derived directory for an executed GUI run")
                for path in sorted(folder.rglob("*")):
                    name = path.relative_to(folder).as_posix()
                    if path.is_file() and path.suffix.lower() in SUFFIXES and not excluded(name):
                        pub.add(path, kind + "/" + run_id + "/" + name, group, sample="release")
                if kind == "runs":
                    pub.validate_sample_manifest(folder, "manifest.json", kind + "/" + run_id, release=True)
        dataset_files(pub, run, "release/research-dataset", group)


def write_publication(pub, include_release):
    sample_note = {"schema": "public-redacted-research-samples-v1", "sourceVersion": "0.17.0-beta.1 / testnet preview historical baseline",
        "selectedRuns": "all five actual-Qwen basic runs and all three actual-Qwen procurement runs from the specified final baseline",
        "selectionBias": "No run chosen by success. Basic model success 4/5; procurement task failures are included.",
        "originalIntegrity": "Original manifests and content-addressed identifiers refer to the original local files. Redacted files may not verify against those original manifests; this archive is an analysis derivative, not an unchanged import bundle.",
        "publicIntegrity": "Verify published bytes against the repository publication-index.json. Each entry retains the exact original local SHA256 and the public SHA256.",
        "privacy": "Only self-created synthetic experiments. Private ground truth is intentional research data, not user secrets. Credentials and runtime secrets are excluded; local machine/account/absolute paths are replaced.",
        "scope": "Isolated EVM evidence, not public-testnet settlement. Outcomes and version fields are not rewritten."}
    pub.samples["PUBLICATION.json"] = js(sample_note)
    archives = {HISTORY_ZIP: pub.samples}
    if include_release:
        pub.release_samples["PUBLICATION.json"] = js({**sample_note, "sourceVersion": "0.18.0", "sourceHash": RELEASE_HASH,
            "selectedRuns": "All seven V0.18 GUI runs: five basic tasks, parameterized pause/resume approve, readonly balance",
            "selectionBias": "All run IDs listed by the completed GUI harness are retained, without outcome filtering.",
            "modelScope": "Scripted GUI tasks against actual isolated EVM transactions. This archive does not claim new V0.18 LLM inference; the separate historical archive contains actual Qwen inference."})
        archives[RELEASE_ZIP] = pub.release_samples
    for filename, entries in archives.items():
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
            for name, data in sorted(entries.items()):
                item = zipfile.ZipInfo(name, (2026, 11, 16, 0, 0, 0))
                item.compress_type = zipfile.ZIP_DEFLATED
                archive.writestr(item, data)
        pub.files[filename] = buffer.getvalue()
    pub.files["named-test-cases.csv"] = csv_data(pub.cases)
    pub.files["publication-index.json"] = js({"schema": "public-evidence-publication-v1", "publicationRelease": "V0.18.0", "includesReleaseRegression": include_release,
        "historicalSourceVersion": "V0.17.0 beta.1 testnet preview (not relabelled V0.18)", "selection": sample_note,
        "sampleArchives": {name: {"entryCount": len(entries), "sourceVersion": "0.18.0" if name == RELEASE_ZIP else "0.17.0-beta.1 testnet preview", "sourceHash": RELEASE_HASH if name == RELEASE_ZIP else "see original run configurations and historical/program-identity.json"} for name, entries in archives.items()},
        "fileCount": len(pub.index), "redactedFileCount": sum(x["redacted"] for x in pub.index), "namedCaseObservations": len(pub.cases),
        "namedCaseCountMeaning": "Explicit names only. Repeated reports/log observations are retained; row count is not a unique-test count.", "files": pub.index})
    pub.files["scan-report.json"] = js({"schema": "public-evidence-scan-v1", "credentialFieldsChecked": sorted(SECRET_FIELDS), "fileSelectionExcludedSecrets": True,
        "allPublishedTextScanned": True, "remainingCredentialAlerts": 0, "remainingLocalPathOrAccountAlerts": 0,
        "sourceManifestCompletenessChecks": {"historicalResearchRuns": 3, "releaseGuiRuns": 7 if include_release else 0, "sealedFileHashesAndLengthsChecked": True},
        "windowsLongPaths": "Extended paths are used when reading evidence so deeply nested raw blobs are not silently skipped.",
        "pngReview": "Only 01-ready-desktop.png is included. Visually inspected: no personal username, absolute local path or unmasked credential.",
        "limits": "Rule-based scanner; not a proof of absence of all sensitive content. Inputs are self-created lab experiments, not user/customer data."})
    pub.files["README.md"] = readme(include_release).encode("utf-8")
    for name, data in pub.files.items():
        scan(data, name, public=True)
    hashes = "\n".join(digest(data) + "  " + name for name, data in sorted(pub.files.items())) + "\n"
    pub.files["SHA256SUMS.txt"] = hashes.encode("utf-8")
    for name, data in pub.files.items():
        target = OUT / name
        if not inside(target, OUT):
            raise ValueError("Output path escapes publication root")
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
    for filename in archives:
        with zipfile.ZipFile(OUT / filename) as archive:
            assert archive.testzip() is None
            for item in pub.index:
                if item["publicPath"].startswith(filename + "::"):
                    name = item["publicPath"].split("::", 1)[1]
                    assert digest(archive.read(name)) == item["publicSha256"]
    print(json.dumps({"files": len(pub.files), "historicalSampleEntries": len(pub.samples), "releaseSampleEntries": len(pub.release_samples), "bytes": sum(map(len, pub.files.values())), "sampleZips": {name: len(pub.files[name]) for name in archives}, "redactedSources": sum(x["redacted"] for x in pub.index), "namedCaseObservations": len(pub.cases), "includesV018Release": include_release}, ensure_ascii=False))


def readme(release):
    return """# V0.18.0 公开验收证据

本目录将本次发布回归与历史基线分开，所有测试均来自自建实验。历史记录的版本和结果保持原义，不能解释为 V0.18 再次运行，也不能解释为公网测试网成交证明。

""" + ("`release/` 包含 V0.18 的完整 26 阶段回归、GUI 与便携包验收，以及研究数据集评估。\n\n[下载 V0.18 七次测试网适配实验的原记录与派生图](release-v018-testnet-samples.zip)：五类基础任务、参数与双暂停授权任务、只读余额，共七次 GUI 运行，全部纳入。构建 sourceHash：`" + RELEASE_HASH + "`。这些是 V0.18 脚本驱动的真实隔离 EVM 交易与查询，不代表公网成交或新增 LLM 能力测量；模型推理证据单独列为历史样本。\n" if release else "V0.18 发布回归尚未并入本目录；当前仅包含明确标注的历史基线。\n") + """
`historical/` 是 V0.17.0-beta.1 测试网预览最终轮的 26/26 回归、真实 Qwen、GUI 15/15 和便携包结果，另保留四轮失败摘要及失败阶段完整日志、Windows journal 与暂停竞态的修复证据。模型能力与平台采集能力分开评价：基础任务模型成功 4/5；采购任务的模型失败也完整保留。

[下载八次完整历史运行的公开分析样本](historical-v017-preview-samples.zip)：五类基础任务各一次，以及 exact、batch、ERC-8183 三次采购运行。包含实际模型请求/响应、事件、工具结果、交易回执、图数据与私有实验真值。按预先列明的任务集合选择，未按成功与否筛选；未复制测试运行时、钱包秘密或模型文件。

**脱敏与完整性：** 本机路径、账户名和机器标识替换为明确占位符，交易值、模型输出语义、版本、失败结果和原始哈希保留。`publication-index.json` 逐文件记录原始本机 SHA256、公开副本 SHA256、是否修改及其来源；样本从 bundle 解包时还记录原 bundle SHA256。未修改文件保持原始字节。修改后的副本不冒充原始实验包，其旧 manifest/blob 地址描述原始文件，不能用原验证器的结果证明脱敏副本未修改；应使用公开 SHA256 清单和 publication index 核验。本 ZIP 用于离线研究分析，非直接导入的未经修改实验 bundle。

`named-test-cases.csv` 只收录日志/报告明确命名的已执行用例。同一测试可能同时出现在日志和结果 JSON 中，因此行数不是独立用例数；失败记录与模型任务结果未隐藏。`scan-report.json` 说明排除规则、凭据/路径扫描及截图复核边界。`SHA256SUMS.txt` 核验本目录公开文件（不包括自身或工具源码）。

`private-*` 和样本中的 `private/` 是自建实验预算、任务标签等研究真值，供评估推断结果；这些目录不是钱包私钥。请保持攻击者视图与真值的研究隔离，勿将这些真值误作为攻击输入。

整理脚本在 `tools/publish_evidence.py`，仅转换和筛选证据，不执行实验或修改原始文件。运行需要原作者本机证据输入，公开使用者可直接分析已下载样本，无需运行整理脚本。
"""


def self_test():
    assert excluded("data/wallet.json") and excluded("x/wallet-secret.json") and excluded("../bad")
    assert not excluded("research/private/ground-truth.json")
    inspect({"apiKey": "[REDACTED]", "txHash": "0x" + "a" * 64})
    for value in [{"privateKey": "x"}, {"apiKey": "secret-value"}]:
        try:
            inspect(value)
            raise AssertionError("Secret was allowed")
        except ValueError:
            pass
    print("SELF_TEST_PASS")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workspace", type=Path)
    parser.add_argument("--include-release", action="store_true")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        sys.exit(0)
    if not args.workspace:
        parser.error("--workspace is required")
    publication = Publication(args.workspace)
    collect(publication, args.include_release)
    write_publication(publication, args.include_release)
