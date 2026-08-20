## 2024-08-04 - SSRF and Path Traversal via Unencoded URL Parameters
**Vulnerability:** Found that user-controlled inputs (`repo` mapped to `owner` and `name`, and `branch`) in `src/app/api/github/sync/route.ts` were passed unsanitized and unencoded into `src/lib/github-server.ts` to construct `fetch` URLs for the GitHub API. An attacker could potentially use path traversal characters or query string delimiters to alter the endpoint or manipulate the queries.
**Learning:** External API URLs constructed from dynamic user inputs must always be properly URL-encoded.
**Prevention:** Use `encodeURIComponent` on dynamic segments before inserting them into template literal URLs, and split file paths by `/` to encode individual segments.

## 2026-08-18 - Authorization Bypass via Client-Editable Metadata
**Vulnerability:** The application trusted Supabase's `user_metadata` object for authorization checks (specifically checking `user_metadata.role === "admin"` in `src/app/api/admin/prompts/route.ts`).
**Learning:** The `user_metadata` object in Supabase is completely under user control and can be modified directly from the client via the Auth API (e.g. `supabase.auth.updateUser({ data: { role: 'admin' } })`). Trusting it for authorization creates an immediate privilege escalation and authorization bypass vulnerability.
**Prevention:** Only use `app_metadata` (which requires a service role key to modify) or a secure backend database table for any authorization or security-critical user state.
## 2024-05-24 - SSRF and Path Traversal in GitHub URL construction
**Vulnerability:** Constructing raw.githubusercontent.com URLs using unsanitized user/variable input (`sha` and `path`) allowed potential path traversal or SSRF if those variables contained malicious sequences like `../` or query parameters.
**Learning:** Even internal helper functions that seem safe because they take inputs from "our code" can be vectors if those inputs originate externally (e.g. branch names, paths).
**Prevention:** Always use `encodeURIComponent` when interpolating variables into URL segments. For paths, split by `/`, map with `encodeURIComponent`, and join back to preserve directory structure while escaping malicious characters.
