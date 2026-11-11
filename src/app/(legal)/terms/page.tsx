import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig, pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  path: "/terms",
  title: "Terms of Service",
  description: `The terms governing your use of ${siteConfig.name}, its Free and Pro plans, and generated build prompts.`,
});

export default function TermsPage() {
  return (
    <article className="legal-prose max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Terms of Service</h1>
      
      <h2>1. The Product</h2>
      <p>
        nxstudio is a planning tool. It outputs architecture decisions and prompts, not production code. You are responsible for the code your AI agents generate using our output.
      </p>

      <h2>2. Accounts & Access</h2>
      <p>
        You must authenticate via GitHub and be 16 or older. Do not share your account or use the service for unlawful purposes.
      </p>

      <h2>3. Content Ownership</h2>
      <p>
        You own your briefs. We store them only to provide the service. See the <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>4. Billing & Refunds</h2>
      <p>
        Pro is billed per 28-day cycle. Payments are processed by Razorpay (fiat) or verified on-chain (crypto). See <Link href="/refund">Refunds & Billing</Link> for cancellation rules.
      </p>

      <h2>5. Liability</h2>
      <p>
        The service and its generated prompts are provided &quot;as is&quot;. Our maximum liability is capped at the amount you paid in the 28 days preceding any claim.
      </p>

      <h2>6. Contact</h2>
      <p>
        {siteConfig.contactEmail ? (
          <>
            Email <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a> for legal or support inquiries.
          </>
        ) : (
          "Reach out through the project repository for legal or support inquiries."
        )}
      </p>
    </article>
  );
}
