## 2024-05-24 - [Path Traversal in GitHub URL construction]
**Vulnerability:** The `fetchFileContentAtSha` function in `src/lib/github-temporal.ts` constructed a GitHub raw URL using unvalidated and unencoded `sha` and `path` variables.
**Learning:** `encodeURIComponent` does not encode `.` or `..`. An attacker could exploit this by providing a payload like `../../../` in the path, successfully breaking out of the intended directory structure. Splitting by `/` and encoding parts does not mitigate `..`.
**Prevention:** Explicitly validate against path traversal payloads (e.g., `path.includes("..")`) in addition to URL-encoding segments when constructing URLs with dynamic inputs.
