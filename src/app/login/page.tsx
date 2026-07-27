import { NxLogo } from "@/components/icons";
import { GitHubSignIn } from "./github-signin";

const ERROR_MESSAGES: Record<string, string> = {
  auth: "Sign-in failed. Please try again.",
  "auth-callback-failed": "We couldn't complete sign-in. Please try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}) {
  const { redirectTo, error } = await searchParams;
  // Guard against open redirects: only allow same-origin relative paths.
  const safeRedirect =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/canvas";

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="canvas-glow" aria-hidden />
      <div className="relative z-10 w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <NxLogo className="h-10 w-10 text-primary" />
          <h1 className="mt-5 text-2xl font-bold tracking-tight">Welcome to nxstudio</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to turn your brief into a tech stack and one build prompt.
          </p>
        </div>

        <div className="mt-8 rounded-2xl glass p-6">
          {error && ERROR_MESSAGES[error] && (
            <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-sm text-red-400">
              {ERROR_MESSAGES[error]}
            </p>
          )}
          <GitHubSignIn redirectTo={safeRedirect} />
          <p className="mt-4 text-center text-xs text-muted-foreground">
            By continuing you agree to the terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}
