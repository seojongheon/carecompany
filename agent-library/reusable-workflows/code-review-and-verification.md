# Skill - Code Review and Verification

## When To Use

Use this skill after feature implementation is complete and before claiming completion.

## Goal

Check whether the implementation matches `spec.md`, `plan.md`, and `tasks.md`, and decide completion based on real test and build results.

## Code Review Request Prompt

```text
Use Superpowers requesting-code-review to review this feature branch.
Check whether the implementation matches spec.md, plan.md, and tasks.md.
Report findings by Critical / High / Medium / Low severity.
```

## Review Standards

### Critical

- Possible data loss
- Auth or authorization bypass
- Payment or token deduction error
- API key exposure
- A user can see another user's analysis result

### High

- Major feature missing
- Analysis result not saved
- History cannot reopen saved results
- Tests fail
- Build fails

### Medium

- Unclear UX flow
- Missing error message
- Weak fallback behavior
- Possible performance regression

### Low

- Naming improvement
- Component separation
- Documentation improvement
- Style cleanup

## Git Principle After Review

Do not commit when only review feedback has been received.
Commit and push after fixes are made and tests pass.

```bash
git add .
git commit -m "fix: address review findings for <feature-name>"
git push
```

## Final Verification Prompt

```text
Use verification-before-completion.
Do not claim completion yet. Decide completion only from real test, build, and manual verification results.
```

## Final Verification Commands

```bash
git status
npm test
npm run lint
npm run build
pytest
```

Do not commit when verification creates no changes.
If verification causes fixes, commit and push only after tests pass.

## Branch Finish Prompt

```text
Use Superpowers finishing-a-development-branch.
Check the current branch test state, remaining changes, and whether merge or PR is possible.
Suggest the finishing procedure.
```

## Branch Finish Git Example

```bash
git push
git checkout main
git pull
git branch -d feature/<feature-name>
```

