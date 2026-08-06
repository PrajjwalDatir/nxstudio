import Link from "next/link";
import { NxLogo, MailIcon } from "@/components/icons";
import { XMark } from "@/components/landing/brand-icons";
import { siteConfig } from "@/lib/site";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Pricing", href: "/pricing" },
      { label: "FAQ", href: "/faq" },
      { label: "Sign in", href: "/login" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Team", href: "/about#team" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Refunds", href: "/refund" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2.5" aria-label="nxstudio home">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card">
              <NxLogo className="h-4 w-4 text-primary" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">nxstudio</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            {siteConfig.tagline} Your staff-level tech cofounder. Describe your vision, get a production-ready build prompt.
          </p>
          <div className="mt-5 flex items-center gap-2">
            <a
              href={siteConfig.links.x}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="nxstudio on X"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <XMark className="h-4 w-4" />
            </a>
            <a
              href={`mailto:${siteConfig.contactEmail}`}
              aria-label="Email nxstudio"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <MailIcon className="h-4 w-4" />
            </a>
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {col.title}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Connect
          </h3>
          <ul className="mt-4 space-y-2.5">
            <li>
              <a
                href={siteConfig.links.x}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {siteConfig.twitterHandle}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {siteConfig.contactEmail}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-6 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} nxstudio. All rights reserved.</p>
          <p>
            Built by{" "}
            <a
              href={siteConfig.authorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/80 transition-colors hover:text-foreground"
            >
              {siteConfig.authorName}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
