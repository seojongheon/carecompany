# Agent Workflow Guide

## Purpose

This repository uses the global Spec Kit and Superpowers capabilities with the local workflow documents in `.agents/workflows/`.

## Ownership Boundary

- Spec Kit owns **what**: requirements, clarification, technical planning, and task breakdown.
- Superpowers owns **how**: implementation execution, TDD, debugging, review, verification, and branch completion.
- Do not use `speckit-implement` when Superpowers owns implementation.
- Treat the approved `tasks.md` as the implementation contract. Do not rewrite planning documents during implementation; return to planning when the contract is wrong or incomplete.

## Workflow Selection

- Small, low-risk changes may use a direct implementation workflow.
- Use the full workflow for multi-screen, API, database, auth, payment, or otherwise high-risk work:
  1. Spec Kit: specify → clarify → plan → tasks
  2. Superpowers: TDD implementation → review → verification → branch finish

## Local Workflow Documents

- `.agents/workflows/spec-kit-feature-workflow.md`
- `.agents/workflows/superpowers-tdd-implementation.md`
- `.agents/workflows/code-review-and-verification.md`
- `.agents/workflows/branch-setup-and-finish.md`

## Reusable Library

`agent-library/` preserves reusable and project-specific source skills for future projects. It is a reference library, not an always-on instruction set.

