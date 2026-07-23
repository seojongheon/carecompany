# Auth Contract

## Session

`AuthSession` contains normalized email, `customer | admin | super_admin`, active state, and expiry. The server derives role and active state from the current profile; browser-provided role values are ignored.

## Operations

- `signUpCustomer({ email, password })`: creates an Auth user; resulting profile is customer-only.
- `signInCustomer({ email, password })`: succeeds only for customer UI use; admin roles may still authenticate but are redirected according to server profile.
- `signInAdmin({ email, password })`: authenticates then requires active admin or super-admin profile; otherwise signs out and returns a generic denial.
- `requestPasswordReset(email)`: always returns the same success-shaped message after requesting a recovery email.
- `signOut()`: revokes the local session and clears cookies.
- `getServerAuthContext()`: returns verified user/profile or null; never trusts raw session user metadata.

## Failure contract

Provider details are logged only in sanitized server diagnostics. UI messages do not reveal whether an email exists, whether an account is inactive, or which administrator role is missing.
