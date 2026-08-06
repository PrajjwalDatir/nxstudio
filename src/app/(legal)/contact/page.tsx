import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";
import { MailIcon, GithubIcon, MapPinIcon } from "@/components/icons";
import { XMark } from "@/components/landing/brand-icons";

export const metadata: Metadata = {
  title: "Contact Us",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Contact Us</h1>
      <p className="mt-4 text-muted-foreground">
        {siteConfig.legalEntity} is a two-person team. Real people read your emails and reply within 1 business day.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <a
          href={`mailto:${siteConfig.contactEmail}`}
          className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-4 transition-colors hover:border-primary/40"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/30">
            <MailIcon className="h-4 w-4" />
          </span>
          <span className="text-sm font-medium">{siteConfig.contactEmail}</span>
        </a>

        <a
          href={siteConfig.links.x}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-4 transition-colors hover:border-primary/40"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/30">
            <XMark className="h-4 w-4" />
          </span>
          <span className="text-sm font-medium">{siteConfig.twitterHandle}</span>
        </a>

        <a
          href={siteConfig.authorUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-4 transition-colors hover:border-primary/40"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/30">
            <GithubIcon className="h-4 w-4" />
          </span>
          <span className="text-sm font-medium">Founder GitHub</span>
        </a>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/30">
            <MapPinIcon className="h-4 w-4" />
          </span>
          <span className="text-sm font-medium">India (IST)</span>
        </div>
      </div>
    </div>
  );
}
