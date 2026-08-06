import Link from "next/link";
import { NxLogo } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center text-center px-6">
        <NxLogo className="h-12 w-12 text-primary mb-6" />
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">404</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          This page could not be found.
        </p>
        <div className="mt-8">
          <Link
            href="/canvas"
            className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            Back to Canvas
          </Link>
        </div>
      </div>
    </div>
  );
}
