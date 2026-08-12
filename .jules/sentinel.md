## 2024-08-04 - SSRF and Path Traversal via Unencoded URL Parameters
**Vulnerability:** Found that user-controlled inputs (`repo` mapped to `owner` and `name`, and `branch`) in `src/app/api/github/sync/route.ts` were passed unsanitized and unencoded into `src/lib/github-server.ts` to construct `fetch` URLs for the GitHub API. An attacker could potentially use path traversal characters or query string delimiters to alter the endpoint or manipulate the queries.
**Learning:** External API URLs constructed from dynamic user inputs must always be properly URL-encoded.
**Prevention:** Use `encodeURIComponent` on dynamic segments before inserting them into template literal URLs, and split file paths by `/` to encode individual segments.

## 2024-08-12 - Supabase user_metadata Auth Bypass
**Vulnerability:** Found `user.user_metadata?.role === "admin"` used for authorization checks in `src/app/api/admin/prompts/route.ts`. The `user_metadata` field is editable by users via the client-side Auth API.
**Learning:** `user_metadata` can be arbitrarily modified by the authenticated user and cannot be trusted for authorization or privilege escalation.
**Prevention:** Rely exclusively on `app_metadata` (set only by admin/service roles) or secure database tables (like `user_roles`) for authorization checks.
