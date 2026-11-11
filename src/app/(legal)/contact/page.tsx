import type { Metadata } from "next";
import { siteConfig, pageMetadata } from "@/lib/site";
import { MailIcon, GithubIcon } from "@/components/icons";
import { XMark } from "@/components/landing/brand-icons";

export const metadata: Metadata = pageMetadata({
  path: "/contact",
  title: "Contact Us",
  description: `Reach the ${siteConfig.name} maintainers by email.`,
});

export default function ContactPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Contact Us</h1>
      <p className="mt-4 text-muted-foreground">
        Reach out to the {siteConfig.legalEntity} for support, billing, or general inquiries.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {siteConfig.contactEmail && (
          <a
            href={`mailto:${siteConfig.contactEmail}`}
            className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-4 transition-colors hover:border-primary/40"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-accent-foreground border border-primary/30">
              <MailIcon className="h-4 w-4" />
            </span>
            <span className="text-sm font-medium">{siteConfig.contactEmail}</span>
          </a>
        )}

        {siteConfig.links.x && siteConfig.twitterHandle && (
          <a
            href={siteConfig.links.x}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-4 transition-colors hover:border-primary/40"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-accent-foreground border border-primary/30">
              <XMark className="h-4 w-4" />
            </span>
            <span className="text-sm font-medium">{siteConfig.twitterHandle}</span>
          </a>
        )}

        {siteConfig.authorUrl && (
          <a
            href={siteConfig.authorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-4 transition-colors hover:border-primary/40"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-accent-foreground border border-primary/30">
              <GithubIcon className="h-4 w-4" />
            </span>
            <span className="text-sm font-medium">Project Repository</span>
          </a>
        )}
      </div>
    </div>
  );
}
