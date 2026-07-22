# Branch Setup and Finish

## When to use

Use when starting a feature in a Git repository or preparing completed work for merge or a pull request.

## Start

1. Inspect `git status` and the current branch.
2. Do not overwrite or absorb unrelated dirty changes.
3. Create or select an appropriately named feature branch before substantive implementation when the repository workflow requires branches.

## Finish

1. Confirm the working tree and diff match the intended scope.
2. Run the relevant tests, linting, type checks, build, and manual verification.
3. Request code review when the change is feature-sized or high-risk.
4. Commit only verified changes, then push or open a pull request when authorized.

