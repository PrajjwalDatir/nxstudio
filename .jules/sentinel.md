## 2024-08-04 - SSRF and Path Traversal via Unencoded URL Parameters
**Vulnerability:** Found that user-controlled inputs (`repo` mapped to `owner` and `name`, and `branch`) in `src/app/api/github/sync/route.ts` were passed unsanitized and unencoded into `src/lib/github-server.ts` to construct `fetch` URLs for the GitHub API. An attacker could potentially use path traversal characters or query string delimiters to alter the endpoint or manipulate the queries.
**Learning:** External API URLs constructed from dynamic user inputs must always be properly URL-encoded.
**Prevention:** Use `encodeURIComponent` on dynamic segments before inserting them into template literal URLs, and split file paths by `/` to encode individual segments.

## 2024-05-18 - Admin Authorization Bypass via `user_metadata`
**Vulnerability:** The `/api/admin/prompts` endpoint was checking for admin privileges by validating `user.user_metadata?.role === "admin"`.
**Learning:** `user_metadata` is completely untrusted for security operations, as users can modify it freely through the client-side Supabase `auth.updateUser` API. This allows any user to grant themselves admin privileges and bypass the check.
**Prevention:** Always verify roles and access levels using `app_metadata` (which is server-managed and immutable by users) or through secure backend database queries (e.g., `user_roles` table).
