# Discord CI Notifications

LostLink sends filtered completion metadata for `Quality gates`, `CodeQL`, and
`Pull request policy` to the private Discord channel selected by the webhook.
The notifier never reads or forwards job logs, stack traces, application data,
claim evidence, environment values, or authorization headers.

## Configure the webhook

1. In Discord, create an incoming webhook for `#lostlink-ci` and copy its URL.
2. In the GitHub repository, open **Settings > Secrets and variables > Actions**.
3. Create a repository secret named `DISCORD_WEBHOOK_URL` containing the URL.
4. Do not place the URL in source code, `.env.example`, issues, pull requests,
   logs, screenshots, or chat messages.

The workflow runs after an allowlisted upstream workflow completes. It checks
out only the repository default branch, never the pull request head, and executes
the notifier from that trusted branch. Its only permission is `contents: read`.
Branch-scoped concurrency cancels an older pending notification when newer runs
for the same repository and branch overlap, reducing duplicate Discord traffic.

## Payload and result mapping

Only workflow name, branch, seven-character commit, actor, conclusion,
repository name, and the GitHub Actions run link are sent. Control characters,
Discord mentions, Markdown markers, and oversized field values are filtered.
Payload JSON is produced with Python's JSON serializer.

| GitHub conclusion | Discord label | Color |
| --- | --- | --- |
| `success` | Success | Green |
| `failure` | Failed | Red |
| `cancelled` | Cancelled | Yellow |
| Any other conclusion | Completed | Blue |

## Validate without sending

Save a synthetic `workflow_run` event outside the repository, then run:

```powershell
python .github/scripts/discord_notification.py --event-file <event.json> --dry-run
```

Dry-run mode does not read the webhook secret or make a network request. The
command exits non-zero for a workflow outside the allowlist, malformed event
metadata, or a non-GitHub Actions URL.

## Failure and rotation

A missing or invalid webhook secret, network failure, timeout, or non-2xx
Discord response fails the notification workflow clearly without changing the
already-completed upstream CI result. Error output never includes the webhook URL
or Discord response body.

If the webhook may have been exposed, delete it in Discord immediately, create a
replacement, and update the GitHub Actions secret. Re-run the failed notification
workflow only after the new secret is configured.
