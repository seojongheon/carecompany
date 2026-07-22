# Skill - Spec Kit Feature Workflow

## When To Use

Use this skill when any of the following are true:

- The feature is expected to take more than 2 hours.
- The feature involves multiple screens, APIs, or database changes.
- The feature is a core production capability.
- The feature has high failure cost, such as auth, payment, analysis, crawling, or history.

## Goal

Use Spec Kit to complete implementation planning documents before implementation starts.

Expected outputs:

- `spec.md`
- clarified `spec.md`
- `plan.md`
- `tasks.md`

## Strict Boundary

- Spec Kit MUST NOT participate in development implementation.
- Spec Kit MUST NOT write, edit, refactor, or test production code.
- Spec Kit stops after planning documents are produced and reviewed.
- Implementation must be handed off to Superpowers using `tasks.md` as the contract.

## Procedure

### 1. Specify

Define what should be built from the user's point of view.

```text
/speckit.specify
```

or

```text
$speckit-specify
```

Writing standards:

- Focus on user requirements, not implementation details.
- Describe the user flow clearly.
- Write acceptance criteria.
- Mark uncertain conditions.

Commit:

```bash
git add .specify
git commit -m "spec: define <feature-name>"
git push -u origin feature/<feature-name>
```

### 2. Clarify

Resolve ambiguous conditions.

```text
/speckit.clarify
```

or

```text
$speckit-clarify
```

Example clarification topics:

- Whether login is required
- Whether results are saved
- Whether deletion is allowed
- Retention period
- Token deduction timing
- Refund behavior after failures
- Admin permissions
- Mobile UI expectations

Commit:

```bash
git add .specify
git commit -m "spec: clarify <feature-name> requirements"
git push
```

### 3. Plan

Write the technical plan.

```text
/speckit.plan
```

or

```text
$speckit-plan
```

Writing standards:

- Technology stack
- Architecture
- Data flow
- API contracts
- Database changes
- Test strategy
- Implementation scope that a beginner can follow

Commit:

```bash
git add .specify
git commit -m "plan: add <feature-name> implementation plan"
git push
```

### 4. Tasks

Break implementation into small tasks.

```text
/speckit.tasks
```

or

```text
$speckit-tasks
```

Important:

- Do not skip this step.
- `tasks.md` is the contract handed to Superpowers.
- Tasks must be small and verifiable.

Commit:

```bash
git add .specify
git commit -m "tasks: break down <feature-name> implementation"
git push
```

## Prohibited

- Do not use `/speckit.implement` in this project.
- Do not assign implementation to Spec Kit.
- Do not let Superpowers ignore or rewrite `tasks.md`.

