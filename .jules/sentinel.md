## 2024-08-04 - SSRF and Path Traversal via Unencoded URL Parameters
**Vulnerability:** Found that user-controlled inputs (`repo` mapped to `owner` and `name`, and `branch`) in `src/app/api/github/sync/route.ts` were passed unsanitized and unencoded into `src/lib/github-server.ts` to construct `fetch` URLs for the GitHub API. An attacker could potentially use path traversal characters or query string delimiters to alter the endpoint or manipulate the queries.
**Learning:** External API URLs constructed from dynamic user inputs must always be properly URL-encoded.
**Prevention:** Use `encodeURIComponent` on dynamic segments before inserting them into template literal URLs, and split file paths by `/` to encode individual segments.

## 2026-08-18 - Authorization Bypass via Client-Editable Metadata
**Vulnerability:** The application trusted Supabase's `user_metadata` object for authorization checks (specifically checking `user_metadata.role === "admin"` in `src/app/api/admin/prompts/route.ts`).
**Learning:** The `user_metadata` object in Supabase is completely under user control and can be modified directly from the client via the Auth API (e.g. `supabase.auth.updateUser({ data: { role: 'admin' } })`). Trusting it for authorization creates an immediate privilege escalation and authorization bypass vulnerability.
**Prevention:** Only use `app_metadata` (which requires a service role key to modify) or a secure backend database table for any authorization or security-critical user state.
## 2024-09-11 - Open Redirect bypass in URL path validation
**Vulnerability:** Found that the redirect validation logic in `src/app/login/page.tsx` and `src/app/auth/callback/route.ts` only checked if the URL started with `/` and did not start with `//`. However, browsers can normalize `/\` (slash followed by backslash) to `//`, bypassing the check and enabling Open Redirects.
**Learning:** URL path validation must account for browser normalization quirks, specifically the handling of backslashes.
**Prevention:** To prevent Open Redirect bypasses, always check and reject paths starting with `/\` (e.g., `!path.startsWith("/\\")`) in addition to checking `//`.
