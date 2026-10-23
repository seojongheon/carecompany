# Data model
- profiles: existing identity/role/active source of truth; active membership checked on every protected path.
- admin_activity_logs: immutable actor/action/target/summary/time (no message payload or secret).
- content_documents + versions: key/revision/draft/published/actor/timestamps. Unit-level compare-and-swap and atomic projection publication.
- case_revisions: case_id/revision/status/body+media+video+tag manifest/review/actor/time; preserve published projection.
- media assets/references/cleanup: object ownership and every retained draft/published/history reference, durable removal retries.
- inquiries: owner optional/server-derived, receipt, idempotency key, name/phone/service/region/message/source/status/assignee/time. Private notes/history/attachments stored separately.
- notifications: recipient/event key/target/type/read_at; external channel config/outbox/attempts disconnected until adapter exists.
- analytics_events: event id/browser id/session id/path/source/device/campaign/time; no account IDs or raw IP;90d lifetime.
