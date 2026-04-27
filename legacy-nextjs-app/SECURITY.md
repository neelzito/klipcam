# Security Guidelines

- All secrets are server-side only; never exposed to clients.
- Verify webhook signatures for Stripe (implemented) and Replicate (add HMAC guard if supported).
- Add request rate limiting per user: target 20 generations/hour.
- Validate and sanitize all inputs (zod) across routes.
- Store assets under per-user prefixes; use signed URLs for access.
- Strip EXIF from uploads on server.
- Log security events with user/job context; ensure PII minimized.


