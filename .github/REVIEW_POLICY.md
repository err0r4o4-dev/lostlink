# LostLink Review Policy

Human review is the authoritative approval gate for LostLink. AI assistance may
help authors and reviewers, but it does not replace accountable human approval.

Pull requests into `develop` or `main` are expected to have:

- at least one approval from someone other than the author;
- required CODEOWNERS review;
- a passing `Repository audit` check;
- all review conversations resolved;
- no unresolved high-risk security finding.

Release pull requests target `main` from `develop`. Task pull requests target
`develop` from a `task/*` branch.
