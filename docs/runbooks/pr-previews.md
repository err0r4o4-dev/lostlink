# Pull Request Web Previews

LostLink publishes a frontend-only GitHub Pages preview for pull requests into
`develop` or `main` when the source branch belongs to this repository. Preview
URLs use this form:

```text
https://err0r4o4-dev.github.io/lostlink/pr-preview/pr-<number>/
```

The preview contains the static `apps/web` build only. It does not deploy the Go
API, PostgreSQL, MinIO, or the internal AI service, and it must not be treated as
a staging or production environment.

## Repository setup

1. Merge `.github/workflows/pr-preview.yml` into the target branch.
2. Keep the repository's default workflow permission read-only. The workflow
   grants `contents: write` and `pull-requests: write` only to its publish and
   cleanup jobs. If an organization policy blocks job-level write permissions,
   an administrator must permit them before previews can be published.
3. Open or update a pull request so the workflow creates the `gh-pages` branch.
4. Under **Settings > Pages**, select **Deploy from a branch**, choose
   `gh-pages`, and serve from `/ (root)`.

The first preview may return `404` until GitHub Pages is enabled and the branch
deployment completes. Later workflow runs add or update a sticky pull-request
comment containing the preview URL.

## Security model

The workflow uses `pull_request_target` so its definition comes from the trusted
target branch. Pull-request code is checked out and built only in a job with
`contents: read`; credentials are not persisted. A separate job downloads the
static build artifact and receives the narrowly scoped permissions needed to
write the `gh-pages` branch and update the pull-request comment.

Do not add repository secrets, deployment credentials, or production API URLs to
the build job. Preview output is public and untrusted. The preview build uses hash
routing so direct navigation remains inside its per-PR GitHub Pages directory.
Pull requests from forks are intentionally skipped so external contributors
cannot publish arbitrary content under the repository owner's Pages origin.

## Lifecycle

- `opened`, `reopened`, or `synchronize`: build and publish the current PR head.
- A newer run cancels an older in-progress preview for the same PR.
- `closed`: remove `pr-preview/pr-<number>` from `gh-pages` and update the sticky
  pull-request comment.

## Verification

The build job runs `npm ci` followed by a production Vite build with a per-PR
base path. The publish job rejects missing entry points and symbolic links before
deployment. Existing quality gates remain responsible for lint, unit tests,
Playwright, API, AI, and Compose validation.

If the workflow succeeds but the URL returns `404`, confirm that GitHub Pages is
serving the `gh-pages` branch from its root and allow time for Pages to publish
the latest branch commit.
