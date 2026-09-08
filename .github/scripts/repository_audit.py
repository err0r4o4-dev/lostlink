#!/usr/bin/env python3
"""Run LostLink's dependency-free repository quality and health audit."""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path


ROOT = Path.cwd()
ARTIFACT_DIR = ROOT / ".artifacts"
REPORT_PATH = ARTIFACT_DIR / "quality-report.json"
MAX_FILE_SIZE = 5 * 1024 * 1024

SENSITIVE_VARIABLES = (
    "ANTHROPIC_API_KEY",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_ACCESS_KEY",
    "OPENAI_API_KEY",
    "DATABASE_URL",
    "PRIVATE_KEY",
    "JWT_SECRET",
    "API_KEY",
    "PASSWORD",
    "SECRET",
    "TOKEN",
)
VARIABLE_PATTERN = re.compile(
    rf"\b(?P<variable>{'|'.join(SENSITIVE_VARIABLES)})\b\s*[:=]\s*(?P<value>[^\r\n]+)",
    re.IGNORECASE,
)
PLACEHOLDER_PATTERN = re.compile(
    r"^(?:['\"]?['\"]?|example|placeholder|replace[_-]?me|changeme|todo|"
    r"your[_-].*|<.*>|\$\{.*\}|\$\{\{.*\}\})$",
    re.IGNORECASE,
)
SOURCE_SUFFIXES = {
    ".c",
    ".cpp",
    ".cs",
    ".go",
    ".java",
    ".js",
    ".jsx",
    ".kt",
    ".php",
    ".py",
    ".rb",
    ".rs",
    ".swift",
    ".ts",
    ".tsx",
    ".vue",
}


def tracked_files() -> list[Path]:
    command = [
        "git",
        "-c",
        f"safe.directory={ROOT.as_posix()}",
        "ls-files",
        "-z",
    ]
    result = subprocess.run(command, check=True, capture_output=True)
    return [Path(item) for item in result.stdout.decode().split("\0") if item]


def is_forbidden_sensitive_file(path: Path) -> bool:
    name = path.name.lower()
    if name == ".env.example":
        return False
    return (
        name == ".env"
        or name.startswith(".env.")
        or path.suffix.lower() in {".key", ".pem", ".p12", ".pfx"}
    )


def useful_secret_value(raw_value: str) -> bool:
    value = raw_value.strip().strip("'\" ,")
    if not value or PLACEHOLDER_PATTERN.fullmatch(value):
        return False
    if value.startswith(("process.env.", "os.environ", "getenv(")):
        return False
    return len(value) >= 8


def inspect_files(files: list[Path]) -> dict[str, list[dict[str, object]]]:
    findings: dict[str, list[dict[str, object]]] = {
        "forbidden_sensitive_files": [],
        "possible_secrets": [],
        "merge_conflicts": [],
        "oversized_files": [],
    }

    for relative_path in files:
        path = ROOT / relative_path
        if not path.is_file():
            continue

        if is_forbidden_sensitive_file(relative_path):
            findings["forbidden_sensitive_files"].append({"file": str(relative_path)})

        size = path.stat().st_size
        if size > MAX_FILE_SIZE:
            findings["oversized_files"].append(
                {"file": str(relative_path), "bytes": size}
            )
            continue

        try:
            content = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue

        for line_number, line in enumerate(content.splitlines(), start=1):
            if line.startswith(("<<<<<<< ", "=======", ">>>>>>> ")):
                findings["merge_conflicts"].append(
                    {"file": str(relative_path), "line": line_number}
                )

            match = VARIABLE_PATTERN.search(line)
            if match and useful_secret_value(match.group("value")):
                findings["possible_secrets"].append(
                    {
                        "file": str(relative_path),
                        "line": line_number,
                        "variable": match.group("variable").upper(),
                    }
                )

    return findings


def project_health(files: list[Path]) -> tuple[int, dict[str, bool]]:
    names = {path.as_posix() for path in files}
    application_files = [path for path in files if ".github" not in path.parts]
    has_source = any(path.suffix.lower() in SOURCE_SUFFIXES for path in application_files)
    has_tests = any(
        "test" in path.name.lower() or "tests" in {part.lower() for part in path.parts}
        for path in application_files
        if path.suffix.lower() in SOURCE_SUFFIXES
    )
    checks = {
        "readme": "README.md" in names,
        "contributing_guide": "CONTRIBUTING.md" in names,
        "security_policy": "SECURITY.md" in names,
        "gitignore": ".gitignore" in names,
        "codeowners": ".github/CODEOWNERS" in names,
        "pull_request_template": ".github/pull_request_template.md" in names,
        "dependabot": ".github/dependabot.yml" in names,
        "quality_workflow": ".github/workflows/quality-gates.yml" in names,
        "codeql_workflow": ".github/workflows/codeql.yml" in names,
        "tests_or_preimplementation": has_tests or not has_source,
    }
    return sum(10 for passed in checks.values() if passed), checks


def quality_score(findings: dict[str, list[dict[str, object]]]) -> int:
    score = 100
    score -= min(40, 20 * len(findings["possible_secrets"]))
    score -= min(30, 15 * len(findings["forbidden_sensitive_files"]))
    score -= min(20, 10 * len(findings["merge_conflicts"]))
    score -= min(10, 5 * len(findings["oversized_files"]))
    return max(0, score)


def write_summary(report: dict[str, object]) -> None:
    lines = [
        "## LostLink quality report",
        "",
        f"- Code quality score: **{report['code_quality_score']}/100**",
        f"- Project health score: **{report['project_health_score']}/100**",
        f"- Critical findings: **{report['critical_findings']}**",
        "",
        "The code quality score currently measures repository safety and hygiene. "
        "Stack-specific checks are added automatically when source manifests exist.",
    ]
    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary_path:
        with open(summary_path, "a", encoding="utf-8") as summary:
            summary.write("\n".join(lines) + "\n")
    print("\n".join(lines))


def main() -> int:
    files = tracked_files()
    findings = inspect_files(files)
    health_score, health_checks = project_health(files)
    critical_findings = sum(len(items) for items in findings.values())
    report: dict[str, object] = {
        "code_quality_score": quality_score(findings),
        "project_health_score": health_score,
        "critical_findings": critical_findings,
        "health_checks": health_checks,
        "findings": findings,
    }

    ARTIFACT_DIR.mkdir(exist_ok=True)
    REPORT_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    write_summary(report)

    if critical_findings:
        for category, items in findings.items():
            for item in items:
                location = item["file"]
                if "line" in item:
                    location = f"{location}:{item['line']}"
                variable = f" ({item['variable']})" if "variable" in item else ""
                print(f"ERROR {category}: {location}{variable}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
