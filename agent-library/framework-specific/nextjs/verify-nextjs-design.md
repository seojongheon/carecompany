---
name: verify_nextjs_design
description: A skill to verify Next.js App Router design patterns, Server/Client component rendering logic, and security configurations in the codebase.
---

# Verify Next.js Design and Security Skill

This skill provides instructions for evaluating whether Next.js App Router conventions (especially Server vs. Client component boundaries) and security policies are properly adhered to in the codebase.

## Use Cases

- When Next.js pages (`page.tsx`), layouts (`layout.tsx`), components, or API routes (`route.ts`) have been added or modified.
- When performing pre-deployment checks to identify potential security holes or architectural deviations.

## Exclusions

- Changes that only touch styling rules (e.g., global CSS, configuration files like `postcss.config.mjs`) and do not modify rendering frameworks or data loading logic.

## Verification Checklists (Instructions)

### 1. Rendering Boundaries Checklist (Server vs. Client Components)

Evaluate each page and component against the following:

- **Client Component Directive**: Ensure that components using React Hooks (`useState`, `useEffect`, `useContext`, etc.) or browser event handlers (`onClick`, `onChange`, etc.) are explicitly marked with `"use client"` at the very top.
- **Server Component Defaulting**: Ensure that components not requiring interactivity remain Server Components. Avoid unnecessary `"use client"` directives to reduce the client-side bundle size.
- **Data Fetching Placement**: Verify that data fetching from Supabase or external APIs is prioritized within Server Components or Server Actions, keeping API keys and data fetching logic secure on the server side.

### 2. Security & Secrets Checklist

Ensure that the codebase does not expose sensitive credentials:

- **Environment Variables**:
  - `SUPABASE_SERVICE_ROLE_KEY` and other private keys (e.g., `TOSS_PAYMENTS_SECRET_KEY`) must **never** be prefixed with `NEXT_PUBLIC_`.
  - Ensure these keys are only referenced in server-side files (e.g., API routes, Server Components, or dedicated repository modules in the Data Layer).
- **Supabase Clients**:
  - Verify that `createBrowserClient` is only used for client-side interactions and uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  - Verify that server-side handlers utilize `createServerClient` and implement cookie synchronization correctly.
- **Route Authorization**:
  - Verify that Next.js API Routes (e.g., `/api/...`) check for authenticated Supabase user sessions (e.g., retrieving the user via `supabase.auth.getUser()`) before performing operations, preventing unauthorized access.

## Reporting Results

After running the check, the agent should report:

1. List of analyzed pages/components/routes.
2. Compliance status for Component Rendering and Security.
3. Specific recommendations and line numbers if violations are found.

