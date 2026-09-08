# LostLink

LostLink is a five-person software engineering team project for CPE320
Assignment 2. The repository is prepared for AI-assisted development with
human-reviewed pull requests and automated quality gates.

## Branch workflow

```text
task/* -> pull request -> develop -> release pull request -> main
```

- `main` is the stable release branch.
- `develop` is the integration branch.
- `task/*` branches contain focused implementation work.
- Every merge into `develop` or `main` should pass the repository quality gate
  and receive human review.

## Quality system

The repository includes baseline automation for:

- repository hygiene and secret-risk checks;
- project health and code quality scoring;
- stack-aware Node.js and Python checks when application code is added;
- CodeQL analysis when supported source files are present;
- Dependabot updates for GitHub Actions;
- CODEOWNERS-based human review.

Application-specific database, API, integration, end-to-end, performance, and
AI evaluation commands are discovered from `package.json` scripts as the
implementation is added.

## Current status

Repository governance is configured. Application architecture and local setup
instructions will be documented when the implementation stack is selected.
