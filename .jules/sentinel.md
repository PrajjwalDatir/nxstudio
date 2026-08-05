## 2024-08-04 - SSRF and Path Traversal via Unencoded URL Parameters
**Vulnerability:** Found that user-controlled inputs (`repo` mapped to `owner` and `name`, and `branch`) in `src/app/api/github/sync/route.ts` were passed unsanitized and unencoded into `src/lib/github-server.ts` to construct `fetch` URLs for the GitHub API. An attacker could potentially use path traversal characters or query string delimiters to alter the endpoint or manipulate the queries.
**Learning:** External API URLs constructed from dynamic user inputs must always be properly URL-encoded.
**Prevention:** Use `encodeURIComponent` on dynamic segments before inserting them into template literal URLs, and split file paths by `/` to encode individual segments.
## 2024-08-05 - DB Error Message Leakage via API Responses
**Vulnerability:** Found that multiple billing API endpoints directly returned raw database error messages (`error.message`) in 500 response bodies. This violates the "Fail securely" principle and exposes sensitive database schema information.
**Learning:** Returning raw internal error details to the client is a significant information leakage risk.
**Prevention:** Always log the actual detailed error on the server side (e.g., using `console.error`) and return a generic, non-revealing error message (e.g., "Internal server error") to the client.
