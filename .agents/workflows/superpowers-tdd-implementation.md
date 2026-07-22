# Superpowers TDD Implementation

## When to use

Use after the feature's `spec.md`, `plan.md`, and `tasks.md` are approved, or for a small change with a clear testable requirement.

## Boundary

Superpowers executes the approved task contract. It must not rewrite specifications, plans, architecture documents, data models, or task lists. If planning is wrong or incomplete, stop and request a planning update.

## Procedure

1. Inspect the repository, branch, and working-tree state.
2. Execute tasks in dependency order.
3. For each behavior: write a failing test, confirm the intended failure, write the minimum implementation, confirm it passes, then refactor while tests remain green.
4. Run the relevant project checks after each meaningful unit of work.
5. Request review and run final verification before declaring completion.

## Commit standard

Commit only verified, coherent units of work. Never commit a RED state or claim completion without current evidence from the relevant checks.

