## 2024-08-04 - SSRF and Path Traversal via Unencoded URL Parameters
**Vulnerability:** Found that user-controlled inputs (`repo` mapped to `owner` and `name`, and `branch`) in `src/app/api/github/sync/route.ts` were passed unsanitized and unencoded into `src/lib/github-server.ts` to construct `fetch` URLs for the GitHub API. An attacker could potentially use path traversal characters or query string delimiters to alter the endpoint or manipulate the queries.
**Learning:** External API URLs constructed from dynamic user inputs must always be properly URL-encoded.
**Prevention:** Use `encodeURIComponent` on dynamic segments before inserting them into template literal URLs, and split file paths by `/` to encode individual segments.

## 2026-08-18 - Authorization Bypass via Client-Editable Metadata
**Vulnerability:** The application trusted Supabase's `user_metadata` object for authorization checks (specifically checking `user_metadata.role === "admin"` in `src/app/api/admin/prompts/route.ts`).
**Learning:** The `user_metadata` object in Supabase is completely under user control and can be modified directly from the client via the Auth API (e.g. `supabase.auth.updateUser({ data: { role: 'admin' } })`). Trusting it for authorization creates an immediate privilege escalation and authorization bypass vulnerability.
**Prevention:** Only use `app_metadata` (which requires a service role key to modify) or a secure backend database table for any authorization or security-critical user state.
## 2026-08-29 - [Path Traversal bypass in encodeURIComponent]
**Vulnerability:** Path traversal possible even when user input is encoded because `encodeURIComponent` does not encode `.` or `..`. Discovered in external GitHub URL constructions (e.g. GitHub Temporal engine fetching raw contents).
**Learning:** Developers frequently assume URL encoding sanitizes all inputs against path traversal, which is false for JavaScript's encode methods as they intentionally preserve dot characters for valid filenames/domain structures.
**Prevention:** Always explicitly check for `..` using `.includes('..')` or properly resolve and validate paths server-side before relying exclusively on `encodeURIComponent` for user-provided paths.

## 2024-10-27 - Open Redirect Bypass via Protocol-Relative Normalization
**Vulnerability:** The application checked for open redirects by verifying that paths started with `/` and not `//`. However, browsers normalize `/\` into `//`, creating a protocol-relative URL bypass (e.g., `/\attacker.com` redirects to `https://attacker.com`).
**Learning:** URL sanitization needs to account for browser-specific normalization behaviors, particularly around path separators. A check for `//` is insufficient if the browser resolves `/\` to the same effect.
**Prevention:** Always check and reject paths starting with `/\` (e.g., `!path.startsWith("/\\")`) in addition to checking `//` when validating relative paths.

