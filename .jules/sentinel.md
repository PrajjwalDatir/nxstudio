## 2024-08-04 - SSRF and Path Traversal via Unencoded URL Parameters
**Vulnerability:** Found that user-controlled inputs (`repo` mapped to `owner` and `name`, and `branch`) in `src/app/api/github/sync/route.ts` were passed unsanitized and unencoded into `src/lib/github-server.ts` to construct `fetch` URLs for the GitHub API. An attacker could potentially use path traversal characters or query string delimiters to alter the endpoint or manipulate the queries.
**Learning:** External API URLs constructed from dynamic user inputs must always be properly URL-encoded.
**Prevention:** Use `encodeURIComponent` on dynamic segments before inserting them into template literal URLs, and split file paths by `/` to encode individual segments.
## 2024-05-18 - Supabase Authorization Bypass via user_metadata
**Vulnerability:** Admin authorization logic trusted `user.user_metadata?.role === "admin"`.
**Learning:** Supabase allows authenticated users to update their own `user_metadata` directly from the client via `supabase.auth.updateUser()`, meaning a user could elevate their own privileges.
**Prevention:** Never trust `user_metadata` for security/authorization logic. Rely exclusively on `app_metadata` (which is read-only for clients and set server-side via admin APIs or hooks) or a dedicated database table (like `user_roles`) enforced by Row Level Security (RLS).
