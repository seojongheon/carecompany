# Skill - Branch Setup and Finish

## When To Use

Use this skill when starting a new feature or finishing a feature branch.

## Feature Start Procedure

Update `main`:

```bash
git checkout main
git pull
```

Create a feature branch:

```bash
git checkout -b feature/<feature-name>
```

Branch creation alone usually does not need a commit.
Push after the first document or code change exists.

## Initial Project Setup

Initialize Spec Kit:

```bash
git checkout main
git pull
specify init . --integration codex
git add .
git commit -m "chore: initialize spec-driven workflow"
git push origin main
```

The constitution must include these principles:

- Spec Kit owns WHAT.
- Spec Kit MUST NOT participate in development implementation.
- Superpowers owns HOW.
- Superpowers MUST NOT modify implementation-planning documents.
- `/speckit.tasks` is required.
- `/speckit.implement` is prohibited.
- Commit and push only after verification passes.
- Implement only on a feature branch.
- End-user UI copy must be Korean.

## Commit Standard After Brainstorming

Do not commit if brainstorming happened only in chat.
Commit only when brainstorming output has been written to a file.

```bash
git add .
git commit -m "docs: capture <feature-name> idea"
git push -u origin feature/<feature-name>
```

## Before Finishing A Branch

```bash
git status
npm test
npm run lint
npm run build
pytest
```

## Superpowers Finish Prompt

```text
Use Superpowers finishing-a-development-branch.
Check the current branch test state, remaining changes, and whether the branch is ready for merge or PR.
Suggest the finishing procedure.
```

## Cleanup After Merge

```bash
git push
git checkout main
git pull
git branch -d feature/<feature-name>
```

Delete the remote branch only when needed after PR merge.

```bash
git push origin --delete feature/<feature-name>
```

