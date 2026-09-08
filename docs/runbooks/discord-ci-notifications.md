# Discord CI notifications

LostLink sends completed GitHub Actions results to a private Discord channel by
using a Discord incoming webhook stored as a GitHub Actions secret.

## Data flow

```text
Quality gates / CodeQL / Pull request policy
                    |
                    v
           workflow_run: completed
                    |
                    v
     Discord CI notification workflow
       - no repository checkout
       - no GitHub API permission
       - sanitized metadata only
                    |
                    v
             Discord webhook
```

The notification contains the repository, workflow, result, branch, abbreviated
commit SHA, actor, event, duration, run URL, and pull request number when one is
available. Raw logs, artifacts, environment values, source code, credentials,
claim evidence, private report details, and other application data are never
included.

## One-time Discord and GitHub setup

1. In the LostLink Discord server, create or select a private channel such as
   `#lostlink-ci`.
2. Open **Server Settings -> Integrations -> Webhooks**, create a webhook for the
   channel, and copy its URL.
3. Store the URL directly in the GitHub repository without pasting it into chat,
   an issue, a pull request, a terminal argument, or a tracked file:

   ```powershell
   gh secret set DISCORD_WEBHOOK_URL --repo err0r4o4-dev/lostlink
   ```

   The command prompts for the value without placing it in shell history.
4. Verify only the secret name and update time:

   ```powershell
   gh secret list --repo err0r4o4-dev/lostlink
   ```

The workflow intentionally fails with a generic configuration message when the
secret is absent. It never prints the webhook URL.

## Activation and verification

The `workflow_run` trigger is loaded from the default branch. After human review:

1. Merge the feature pull request into `develop`.
2. Promote `develop` through a human-reviewed release pull request into `main`.
3. Run **Quality gates** manually on `main`, or wait for the next normal run.
4. Confirm that **Discord CI notification** succeeds and the message appears in
   `#lostlink-ci` with a working link to the originating GitHub Actions run.

The notifier listens for both `Quality gates` and the earlier
`Advanced quality gates` name so it remains compatible during the repository
bootstrap transition.

## Failure behavior

- HTTP 429 and temporary Discord server errors are retried up to three times.
- Invalid, missing, or non-Discord webhook URLs fail without displaying the URL.
- A notification failure is visible in its own workflow but cannot change the
  conclusion of the completed quality/security workflow.
- Discord mentions are disabled to prevent branch names or other metadata from
  pinging users or roles.

If the webhook is disclosed, delete it in Discord immediately, create a new one,
and replace the GitHub secret. Never reuse a disclosed webhook.
