import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";
import { MailIcon, GithubIcon, MapPinIcon } from "@/components/icons";
import { XMark } from "@/components/landing/brand-icons";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "How to reach nxstudio for support, billing, or business questions.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <article className="legal-prose">
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Contact Us</h1>
      <p className="mt-4">
        {siteConfig.legalEntity} is a two-person team — questions, bugs, and billing
        issues all land with a real person, usually within a day.
      </p>

      <div className="not-prose mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <a
          href={`mailto:${siteConfig.contactEmail}`}
          className="flex items-start gap-3 rounded-xl border border-border bg-card/40 p-4 transition-colors hover:border-primary/40"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/30">
            <MailIcon className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-sm font-medium text-foreground">Email</span>
            <span className="block text-sm text-muted-foreground">{siteConfig.contactEmail}</span>
          </span>
        </a>

        <a
          href={siteConfig.links.x}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-3 rounded-xl border border-border bg-card/40 p-4 transition-colors hover:border-primary/40"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/30">
            <XMark className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-sm font-medium text-foreground">X (Twitter)</span>
            <span className="block text-sm text-muted-foreground">{siteConfig.twitterHandle}</span>
          </span>
        </a>

        <a
          href={siteConfig.authorUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-3 rounded-xl border border-border bg-card/40 p-4 transition-colors hover:border-primary/40"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/30">
            <GithubIcon className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-sm font-medium text-foreground">Founder</span>
            <span className="block text-sm text-muted-foreground">{siteConfig.authorName}</span>
          </span>
        </a>

        <div className="flex items-start gap-3 rounded-xl border border-border bg-card/40 p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/30">
            <MapPinIcon className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-sm font-medium text-foreground">Based in</span>
            <span className="block text-sm text-muted-foreground">India</span>
          </span>
        </div>
      </div>

      <h2>Support hours</h2>
      <p>
        We reply to {siteConfig.contactEmail} within 1 business day, Monday through
        Friday, India Standard Time (IST). Billing and refund questions are covered
        by our <a href="/refund">Refunds &amp; Billing Policy</a>.
      </p>

      <h2>Business &amp; legal</h2>
      <p>
        See our <a href="/terms">Terms of Service</a> and{" "}
        <a href="/privacy">Privacy Policy</a> for how the service and your data are
        handled. Learn more about who&apos;s behind nxstudio on the{" "}
        <a href="/about">About page</a>.
      </p>
    </article>
  );
}
