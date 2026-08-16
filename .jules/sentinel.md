## 2024-08-04 - SSRF and Path Traversal via Unencoded URL Parameters
**Vulnerability:** Found that user-controlled inputs (`repo` mapped to `owner` and `name`, and `branch`) in `src/app/api/github/sync/route.ts` were passed unsanitized and unencoded into `src/lib/github-server.ts` to construct `fetch` URLs for the GitHub API. An attacker could potentially use path traversal characters or query string delimiters to alter the endpoint or manipulate the queries.
**Learning:** External API URLs constructed from dynamic user inputs must always be properly URL-encoded.
**Prevention:** Use `encodeURIComponent` on dynamic segments before inserting them into template literal URLs, and split file paths by `/` to encode individual segments.

## 2024-08-16 - Authorization Bypass via user_metadata
**Vulnerability:** Found that authorization check in `src/app/api/admin/prompts/route.ts` incorrectly trusted `user.user_metadata?.role === "admin"`.
**Learning:** `user_metadata` in Supabase is editable by the user via the client-side Auth API, meaning any user could escalate their privileges to "admin" by simply updating their own metadata.
**Prevention:** Never trust `user_metadata` for security or authorization checks. Always rely on `app_metadata` (which is read-only for clients and managed by the backend) or a secure database table evaluated securely on the backend.
