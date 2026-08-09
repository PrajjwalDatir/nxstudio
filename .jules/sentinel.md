## 2024-08-04 - SSRF and Path Traversal via Unencoded URL Parameters
**Vulnerability:** Found that user-controlled inputs (`repo` mapped to `owner` and `name`, and `branch`) in `src/app/api/github/sync/route.ts` were passed unsanitized and unencoded into `src/lib/github-server.ts` to construct `fetch` URLs for the GitHub API. An attacker could potentially use path traversal characters or query string delimiters to alter the endpoint or manipulate the queries.
**Learning:** External API URLs constructed from dynamic user inputs must always be properly URL-encoded.
**Prevention:** Use `encodeURIComponent` on dynamic segments before inserting them into template literal URLs, and split file paths by `/` to encode individual segments.

## 2026-08-09 - Privilege Escalation via Supabase user_metadata
**Vulnerability:** The application checked `user.user_metadata?.role === "admin"` to grant admin access to the prompts API. In Supabase, `user_metadata` can be freely modified by the user via the client-side Auth API (`supabase.auth.updateUser({ data: { role: 'admin' } })`), allowing any user to easily elevate their privileges to admin.
**Learning:** Client-editable metadata fields (`user_metadata`) must never be used for authorization checks or role assignments.
**Prevention:** Use `app_metadata` (which is only writable by the service role/admin) or query a secure database table for role-based access control.
