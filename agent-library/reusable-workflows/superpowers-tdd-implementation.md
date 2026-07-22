# Skill - Superpowers TDD Implementation

## When To Use

Use this skill when `tasks.md` exists and actual implementation is about to start.

## Goal

Use the Superpowers workflow to implement tasks in `tasks.md` order with TDD.

## Strict Boundary

- Superpowers owns implementation execution.
- Superpowers MUST NOT modify implementation-planning documents such as `spec.md`, `plan.md`, `architecture.md`, `data-model.md`, or `tasks.md`.
- Superpowers MUST treat `tasks.md` as the implementation contract.
- If a task is wrong, blocked, or incomplete, report it to the user and request a planning-doc update through Spec Kit instead of editing the planning documents directly.

## Before Starting Implementation

```bash
git status
git branch
```

Conditions:

- Work must happen on a feature branch.
- The working tree should be clean or the dirty state must be reported.
- `spec.md`, `plan.md`, and `tasks.md` must exist.

## Example Codex Prompt

```text
Implement based on specs/<feature-id>/tasks.md.

Use the Superpowers workflow.
- Check the current feature branch or worktree state.
- Treat tasks.md order as the contract and do not re-plan it.
- Use TDD for each task.
- Suggest commit candidates only after tests pass.
- Request code review at the end and finish the branch.
```

## TDD Procedure

For each task:

1. Write a failing test.
2. Implement the minimum code.
3. Confirm tests pass.
4. Refactor.
5. Re-run tests.
6. Commit and push when appropriate.

## Test Commands

Frontend:

```bash
npm test
npm run lint
npm run build
```

Backend:

```bash
pytest
```

## Commit Standard

Do not commit in the RED state.
Commit in the GREEN state.

Example:

```bash
git add .
git commit -m "feat: add <feature-name> API"
git push
```

After refactoring:

```bash
git add .
git commit -m "refactor: simplify <feature-name> logic"
git push
```

## Push Strategy For Beginners

- Push after every completed task.
- At minimum, push after every one to three completed tasks.
- Always push before opening a PR.

## Prohibited

- Do not claim completion without verification.
- Do not ignore the `tasks.md` order.
- Do not change the technology stack during implementation.
- Do not implement a large task all at once.
- Do not modify Spec Kit planning documents during implementation.

