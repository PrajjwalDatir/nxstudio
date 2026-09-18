/**
 * Validates and sanitizes a user-supplied redirection target path.
 *
 * Enforces:
 * 1. Must be a relative path beginning with "/" and not "//" or "/\" (protocol-relative).
 * 2. Does not contain backslashes (which browsers may normalize into slashes).
 * 3. Does not contain ASCII/Unicode control characters (CRLF, tabs, null bytes).
 * 4. Resolves against a localhost base to confirm the origin is same-origin and pathname starts with "/".
 * 5. Prevents redirect loops into auth/login routes ("/login", "/auth/callback", "/auth/signout").
 */
export function getSafeRedirectUrl(
  target: string | null | undefined,
  fallback = "/canvas"
): string {
  if (!target || typeof target !== "string") {
    return fallback;
  }

  const trimmed = target.trim();
  if (!trimmed) {
    return fallback;
  }

  // Reject protocol-relative or backslash-based vectors immediately
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\") ||
    trimmed.includes("\\")
  ) {
    return fallback;
  }

  // Reject ASCII control characters (0x00-0x1F, 0x7F) that could manipulate headers
  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    return fallback;
  }

  try {
    const parsed = new URL(trimmed, "http://localhost");
    // Ensure the parsed origin stays localhost and the target does not have a scheme
    if (parsed.origin !== "http://localhost" || !parsed.pathname.startsWith("/")) {
      return fallback;
    }

    // Guard against redirect loops
    const normalizedPath = parsed.pathname.toLowerCase();
    if (
      normalizedPath === "/login" ||
      normalizedPath.startsWith("/auth/")
    ) {
      return fallback;
    }

    // Return the safe relative path (pathname + search + hash)
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
