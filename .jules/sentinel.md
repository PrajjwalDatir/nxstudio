## 2024-08-04 - SSRF and Path Traversal via Unencoded URL Parameters
**Vulnerability:** Found that user-controlled inputs (`repo` mapped to `owner` and `name`, and `branch`) in `src/app/api/github/sync/route.ts` were passed unsanitized and unencoded into `src/lib/github-server.ts` to construct `fetch` URLs for the GitHub API. An attacker could potentially use path traversal characters or query string delimiters to alter the endpoint or manipulate the queries.
**Learning:** External API URLs constructed from dynamic user inputs must always be properly URL-encoded.
**Prevention:** Use `encodeURIComponent` on dynamic segments before inserting them into template literal URLs, and split file paths by `/` to encode individual segments.

## 2024-08-04 - Privilege Escalation via Supabase user_metadata
**Vulnerability:** The admin endpoint `src/app/api/admin/prompts/route.ts` checked `user.user_metadata?.role === "admin"` to grant access.
**Learning:** `user_metadata` in Supabase is editable by the user via the client-side Auth API (`supabase.auth.updateUser()`). Trusting it for authorization allows trivial privilege escalation.
**Prevention:** Always rely on `app_metadata` (which is secure and manageable only on the server side) or a dedicated database table with proper RLS for authorization checks.
