import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeftIcon,
  InspectorLogo,
  CompassLogo,
  LoopsMgmtLogo,
  WickLogo,
} from "@/components/icons";
import { GitHubSignIn } from "./github-signin";
import { CanvasPreview } from "@/components/landing/CanvasPreview";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  path: "/login",
  title: "Sign in",
  description:
    "Sign in with GitHub to turn your product brief into a derived tech stack and one production-ready build prompt. Free, no credit card required.",
});

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
  // We also reject "/\" as browsers normalize it into protocol-relative URLs.
  const safeRedirect =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//") && !redirectTo.startsWith("/\\")
      ? redirectTo
      : "/canvas";

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Form Side - Left */}
      <div className="relative flex w-full flex-col items-center justify-center px-8 py-12 bg-card border-r border-border lg:w-[45%] xl:px-12">
        <div className="mx-auto flex w-full max-w-[340px] flex-col items-center text-center z-10 pb-24">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            Home
          </Link>

          <div className="mt-10 mb-10">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Create your free account
            </h1>
            <p className="mt-3 text-[13px] text-muted-foreground">
              Sign in to turn your brief into a tech stack and one build prompt. No credit card required.
            </p>
          </div>
          
          <div className="w-full">
            {error && ERROR_MESSAGES[error] && (
              <p className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 text-left">
                {ERROR_MESSAGES[error]}
              </p>
            )}

            <GitHubSignIn redirectTo={safeRedirect} />
            
            <p className="mt-8 text-xs text-muted-foreground">
              By continuing, you agree to nxstudio&apos;s{" "}
              <Link href="/terms" className="underline underline-offset-2 hover:text-foreground transition-colors">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground transition-colors">
                Privacy Policy
              </Link>.
            </p>
          </div>
        </div>

        {/* Footer Area */}
        <div className="absolute bottom-8 left-0 right-0 w-full px-8 text-center">
          <p className="text-sm text-muted-foreground mb-8">
            Already have an account? <Link href="/login" className="font-medium text-foreground hover:underline">Log in</Link>
          </p>
          <p className="text-[11px] text-muted-foreground/70 mb-5">Trusted by teams at</p>
          <div className="flex flex-wrap justify-center items-center gap-5 sm:gap-6 opacity-60 transition-opacity hover:opacity-100">
            <span className="text-xs font-semibold tracking-tight text-foreground flex items-center gap-1.5 font-sans">
              <InspectorLogo className="h-4 w-4 text-foreground" />
              Inspector
            </span>
            <span className="text-xs font-semibold tracking-tight text-foreground flex items-center gap-1.5 font-sans">
              <CompassLogo className="h-4 w-4 text-foreground" />
              Compass
            </span>
            <span className="text-xs font-semibold tracking-tight text-foreground flex items-center gap-1.5 font-sans">
              <LoopsMgmtLogo className="h-4 w-4 text-foreground" />
              Loops MGMT
            </span>
            <span className="text-xs font-semibold tracking-tight text-foreground flex items-center gap-1.5 font-sans">
              <WickLogo className="h-4 w-4 text-foreground" />
              Wick
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Canvas Side - Right */}
      <div className="relative hidden w-full overflow-hidden bg-background lg:flex lg:w-[55%] border-l border-border">
        <div className="absolute inset-0 flex items-center justify-center [perspective:2000px]">
          {/* Scaled and angled to create an immersive edge-to-edge collage effect */}
          <div className="w-[1400px] xl:w-[1600px] origin-center opacity-80 pointer-events-none transition-transform [transform:rotateX(25deg)_rotateY(-15deg)_rotateZ(20deg)_scale(0.85)] xl:[transform:rotateX(25deg)_rotateY(-15deg)_rotateZ(20deg)_scale(1.0)] translate-x-20">
            <CanvasPreview />
          </div>
        </div>
      </div>
    </div>
  );
}
