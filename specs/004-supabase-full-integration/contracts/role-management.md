# Role Management Contract

## List users

Only an active super administrator may list profiles for role management. Results contain user ID, normalized email, role, active state, and timestamps; no password, token, or Auth secret is exposed.

## Change role

`setUserAdminRole(targetId, newRole, active, reason)` accepts only `customer` or `admin` as routine target roles. Creating another `super_admin` is excluded from the web UI and remains an operations procedure.

The operation requires a non-empty reason, verifies the actor is an active super administrator, prevents removal or deactivation of the last active super administrator, updates the target, and appends one audit record in a single transaction.

## Initial super administrator

No bootstrap credential or automatic elevation exists. The operations runbook accepts a user UUID and reason at execution time and requires server/SQL administrative access.
