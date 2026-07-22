---
name: verify_tests
description: A skill to run, analyze, and verify the test suite written in this project.
---

# Verify Tests Skill

This skill provides a repeatable workflow to run Vitest test codes within the project, analyze the output, and verify the stability of the system.

## Use Cases

- When verifying that there are no functional regressions after adding new business logic (e.g., Use Case, Repository) or modifying existing code.
- When automating the test verification stage after executing an implementation plan.
- When the user explicitly requests to run or verify tests.

## Exclusions

- This skill does not need to be triggered for simple UI/styling changes (e.g., CSS, Tailwind) that are unrelated to business logic and test coverage.

## Test Execution and Verification Process (Instructions)

### 1. Test Command

Run the following command at the project root directory to execute tests:

```bash
npm run test
```

> [!NOTE]
> The `npm run test` script in `package.json` executes `vitest run`, which runs as a single-run execution rather than a watch mode, making it safe to run as a background task.

### 2. Analyzing Test Results

Once the test run completes, the agent must analyze the console output to verify:

- The total number of **Test Suites** and **Tests**.
- Whether any tests failed (look for `FAIL` indicators).

### 3. Troubleshooting & Debugging Failed Tests

If a test fails, determine the root cause based on the error logs:

1. **Missing Environment Variables**:
   - Check if Supabase or Toss Payments environment variables (e.g., `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `TOSS_PAYMENTS_SECRET_KEY`) are missing from the test environment.
   - Verify that appropriate environment variables are mocked inside the test code or in `vitest.setup.ts`.
2. **Mocking Failures**:
   - Ensure that external API calls (e.g., Toss Payments) or database connections are properly mocked and not initiating real network requests.
   - Check if `vi.mock(...)` setups are correct.
3. **Domain Logic Bugs**:
   - Trace logical errors in recently modified code that lead to mismatching test assertions, and fix the production code.

### 4. Reporting Success

When all tests pass (`PASS`), summarize and report the number of passed test suites and tests to the user.

