# Spec Kit Feature Workflow

## When to use

Use this workflow for a feature that is high-risk, spans multiple files or layers, or is expected to take more than a short focused change.

## Boundary

Spec Kit plans the work; it does not implement production code. Its handoff is a reviewed task list for Superpowers.

## Procedure

1. Use `speckit-specify` to describe user value, scenarios, acceptance criteria, assumptions, and scope.
2. Use `speckit-clarify` only for decisions that materially affect scope, security, or user experience.
3. Use `speckit-plan` to define the technical approach, contracts, data changes, and verification strategy.
4. Use `speckit-tasks` to create small, ordered, verifiable tasks with file paths.
5. Review the resulting `spec.md`, `plan.md`, and `tasks.md` before implementation.
6. Hand implementation to Superpowers. Do not use `speckit-implement` in this workflow.

## Handoff standard

`tasks.md` must be specific enough to execute without re-planning: each task has a clear outcome, affected path, dependencies, and verification method.

