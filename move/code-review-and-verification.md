# Code Review and Verification

## When to use

Use after implementing a feature, before merging, releasing, or reporting that work is complete.

## Review scope

Review implementation against the approved specification, technical plan, and task list. Prioritize findings in this order:

1. Security, data loss, authorization, or secret exposure
2. Missing required behavior, broken contracts, failing tests, or failed builds
3. Error handling, accessibility, performance, and user-flow gaps
4. Maintainability, naming, and documentation improvements

## Verification standard

Run the repository's applicable tests, type checks, linting, build, and focused manual checks. Record commands that could not be run, their reason, and the remaining risk.

## Completion rule

Do not declare completion until review findings in scope are resolved or explicitly accepted, and current verification evidence supports the claim.

