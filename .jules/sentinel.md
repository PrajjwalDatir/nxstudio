## 2024-08-04 - SSRF and Path Traversal via Unencoded URL Parameters
**Vulnerability:** Found that user-controlled inputs (`repo` mapped to `owner` and `name`, and `branch`) in `src/app/api/github/sync/route.ts` were passed unsanitized and unencoded into `src/lib/github-server.ts` to construct `fetch` URLs for the GitHub API. An attacker could potentially use path traversal characters or query string delimiters to alter the endpoint or manipulate the queries.
**Learning:** External API URLs constructed from dynamic user inputs must always be properly URL-encoded.
**Prevention:** Use `encodeURIComponent` on dynamic segments before inserting them into template literal URLs, and split file paths by `/` to encode individual segments.

## 2024-08-10 - Supabase Auth Privilege Escalation via user_metadata
**Vulnerability:** Found that the admin authorization check in `src/app/api/admin/prompts/route.ts` was checking `user.user_metadata?.role === "admin"`.
**Learning:** `user_metadata` in Supabase is editable by the user via the client-side `supabase.auth.updateUser()` API. Any user could set their role to "admin" and gain unauthorized access to administrative endpoints.
**Prevention:** Never trust `user_metadata` for security or authorization checks. Always use `app_metadata` (which can only be modified securely from the server via the service_role key) or a secure database table checked against the authenticated `user.id`.
