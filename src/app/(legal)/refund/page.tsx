import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";

const UPDATED = "July 31, 2026";

export const metadata: Metadata = {
  title: "Refunds & Billing",
  description:
    "How nxstudio Pro billing works — 28-day cycles paid in USDC/USDT on Solana, on-chain verification, cancellation, and our refund policy.",
  alternates: { canonical: "/refund" },
};

export default function RefundPage() {
  return (
    <article className="legal-prose">
      <p className="text-sm text-muted-foreground">Last updated: {UPDATED}</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
        Refunds &amp; Billing Policy
      </h1>
      <p className="mt-4">
        This policy explains how paid plans work at {siteConfig.name}. It forms part
        of our <a href="/terms">Terms of Service</a>.
      </p>

      <h2>1. Plans</h2>
      <ul>
        <li><strong>Free</strong> — $0. One full product workspace with complete access: the brief, tech-stack engine, Studio, the full build &amp; depth prompts, and autonomous machine workflows.</li>
        <li><strong>Pro</strong> — $10 per 28-day cycle. Unlimited active project workspaces and no gates — includes project collections and the prompt gallery of use cases &amp; agent personas.</li>
      </ul>
      <p>
        “Paid plan” below refers to Pro. Amounts are quoted
        in US dollars and settled in equivalent USDC/USDT.
      </p>

      <h2>2. How you pay</h2>
      <p>
        Paid plans are settled in cryptocurrency — <strong>USDC or USDT on the Solana
        network</strong> — to our receiving wallet. Each payment moves real funds
        and is verified on-chain before access is granted. We do not charge cards
        and do not store any card or bank details.
      </p>

      <h2>3. How access works</h2>
      <p>
        Once your payment is confirmed on-chain, your account is granted access to
        the plan you paid for, for a 28-day cycle. Access is derived from your
        confirmed payment — there is no hidden recurring charge.
      </p>

      <h2>4. Renewals &amp; cancellation</h2>
      <p>
        Because crypto payments are non-custodial, we cannot and do not auto-charge
        you. To continue after a cycle ends, you make another payment. To “cancel”,
        simply don’t renew — your paid access continues until the end of the cycle
        you already paid for, then reverts to Free. A short grace
        period may apply around renewal.
      </p>

      <h2>5. Refunds</h2>
      <p>
        Cryptocurrency payments are irreversible and settled on a public blockchain,
        so Pro payments are generally <strong>non-refundable</strong>. That said, we
        want billing to be fair. We will review refund requests in cases such as:
      </p>
      <ul>
        <li>a duplicate payment or a clear overpayment;</li>
        <li>a verified technical error on our side that prevented you from receiving the access you paid for.</li>
      </ul>
      <p>
        To request a review, email{" "}
        <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>{" "}
        within <strong>7 days</strong> of the payment with your transaction
        signature. Approved refunds are issued in the same asset to the originating
        wallet where possible; network fees are non-refundable.
      </p>

      <h2>6. Price changes</h2>
      <p>
        We may change plan pricing over time. Any change applies to future cycles
        only — never retroactively to a cycle you have already paid for.
      </p>

      <h2>7. Contact</h2>
      <p>
        Billing questions? Email{" "}
        <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>.
      </p>
    </article>
  );
}
