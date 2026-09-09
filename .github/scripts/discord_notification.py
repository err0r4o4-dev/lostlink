#!/usr/bin/env python3
"""Send allowlisted GitHub Actions completion metadata to Discord."""

from __future__ import annotations

import argparse
import json
import os
import sys
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any


ALLOWED_WORKFLOWS = frozenset(
    {
        "Quality gates",
        "CodeQL",
        "Pull request policy",
    }
)
RESULT_STYLES = {
    "success": ("Success", "✅", 0x2DA44E),
    "failure": ("Failed", "❌", 0xCF222E),
    "cancelled": ("Cancelled", "⚠️", 0xBF8700),
}
DEFAULT_STYLE = ("Completed", "🔵", 0x0969DA)
DISCORD_HOSTS = frozenset({"discord.com", "ptb.discord.com", "canary.discord.com"})
MAX_FIELD_LENGTH = 256


class NotificationError(RuntimeError):
    """A safe-to-report notification failure."""


def safe_text(value: object, *, fallback: str = "unknown") -> str:
    """Bound and escape untrusted metadata before Discord renders it."""
    raw = str(value or fallback)
    printable = "".join(character for character in raw if unicodedata.category(character)[0] != "C")
    escaped = printable.replace("\\", "\\\\")
    for marker in ("`", "*", "_", "~", "|", ">", "[", "]", "(", ")", "#"):
        escaped = escaped.replace(marker, f"\\{marker}")
    escaped = escaped.replace("@", "＠")
    return escaped[:MAX_FIELD_LENGTH] or fallback


def trusted_github_url(value: object) -> str:
    """Accept only HTTPS links hosted by GitHub."""
    url = str(value or "")
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme != "https" or parsed.hostname != "github.com":
        raise NotificationError("GitHub Actions log URL is not trusted")
    return url


def validate_webhook_url(value: str) -> str:
    """Reject secrets that are not Discord HTTPS webhook endpoints."""
    parsed = urllib.parse.urlparse(value)
    if (
        parsed.scheme != "https"
        or parsed.hostname not in DISCORD_HOSTS
        or not parsed.path.startswith("/api/webhooks/")
        or parsed.username is not None
        or parsed.password is not None
    ):
        raise NotificationError("DISCORD_WEBHOOK_URL is not a valid Discord webhook URL")
    return value


def build_payload(event: dict[str, Any]) -> dict[str, Any]:
    """Create a Discord embed from an allowlisted workflow_run event."""
    run = event.get("workflow_run")
    repository = event.get("repository")
    if not isinstance(run, dict) or not isinstance(repository, dict):
        raise NotificationError("Event does not contain workflow_run metadata")

    workflow_name = str(run.get("name") or "")
    if workflow_name not in ALLOWED_WORKFLOWS:
        raise NotificationError("Workflow is not in the notification allowlist")

    conclusion = str(run.get("conclusion") or "unknown").lower()
    result, icon, color = RESULT_STYLES.get(conclusion, DEFAULT_STYLE)
    commit = safe_text(str(run.get("head_sha") or "unknown")[:7])
    actor = run.get("actor") if isinstance(run.get("actor"), dict) else {}

    fields = [
        {"name": "Workflow", "value": safe_text(workflow_name), "inline": True},
        {"name": "Branch", "value": safe_text(run.get("head_branch")), "inline": True},
        {"name": "Commit", "value": commit, "inline": True},
        {"name": "Actor", "value": safe_text(actor.get("login")), "inline": True},
        {"name": "Result", "value": safe_text(conclusion), "inline": True},
        {"name": "Repository", "value": safe_text(repository.get("full_name")), "inline": True},
    ]
    return {
        "username": "LostLink CI",
        "allowed_mentions": {"parse": []},
        "embeds": [
            {
                "title": f"{icon} LostLink CI {result}",
                "color": color,
                "fields": fields,
                "url": trusted_github_url(run.get("html_url")),
            }
        ],
    }


def load_event(path: Path | None) -> dict[str, Any]:
    if path is None:
        raise NotificationError("GITHUB_EVENT_PATH is not configured")
    try:
        source = sys.stdin.read() if path == Path("-") else path.read_text(encoding="utf-8")
        event = json.loads(source)
    except (OSError, json.JSONDecodeError) as error:
        raise NotificationError("Unable to read the GitHub event payload") from error
    if not isinstance(event, dict):
        raise NotificationError("GitHub event payload must be a JSON object")
    return event


def send_payload(webhook_url: str, payload: dict[str, Any]) -> None:
    body = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    request = urllib.request.Request(
        validate_webhook_url(webhook_url),
        data=body,
        headers={"Content-Type": "application/json", "User-Agent": "LostLink-CI-Notifier/1.0"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            if not 200 <= response.status < 300:
                raise NotificationError(f"Discord returned HTTP {response.status}")
    except urllib.error.HTTPError as error:
        raise NotificationError(f"Discord returned HTTP {error.code}") from error
    except urllib.error.URLError as error:
        raise NotificationError("Discord notification request failed") from error


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--event-file",
        type=Path,
        default=os.environ.get("GITHUB_EVENT_PATH"),
        help="workflow_run event JSON, or - for stdin (defaults to GITHUB_EVENT_PATH)",
    )
    parser.add_argument("--dry-run", action="store_true", help="print the filtered payload without sending")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        payload = build_payload(load_event(args.event_file))
        if args.dry_run:
            print(json.dumps(payload, ensure_ascii=True, indent=2))
            return 0

        webhook_url = os.environ.get("DISCORD_WEBHOOK_URL", "")
        if not webhook_url:
            raise NotificationError("DISCORD_WEBHOOK_URL is not configured")
        send_payload(webhook_url, payload)
        print("Discord CI notification sent")
        return 0
    except NotificationError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
