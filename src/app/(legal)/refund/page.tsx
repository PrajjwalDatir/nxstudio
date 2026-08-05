import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";

const UPDATED = "August 6, 2026";

export const metadata: Metadata = {
  title: "Refunds & Billing",
  description:
    "How nxstudio Pro billing works — 28-day cycles paid by card, UPI, or netbanking via Razorpay, or in USDC/USDT on Solana, cancellation, and our refund policy.",
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
        “Paid plan” below refers to Pro. Amounts are quoted in US dollars; the card
        payment method settles in your local currency at Razorpay&apos;s rate, and the
        crypto payment method settles in equivalent USDC/USDT.
      </p>

      <h2>2. How you pay</h2>
      <p>
        You can pay for Pro in one of two ways:
      </p>
      <ul>
        <li>
          <strong>Card, UPI, or netbanking</strong> — processed by our payment
          partner, <strong>Razorpay</strong>. This sets up a recurring subscription
          that renews automatically every 28 days until cancelled. We never see or
          store your card, UPI, or bank details.
        </li>
        <li>
          <strong>Cryptocurrency</strong> — USDC or USDT on the Solana network, sent
          to our receiving wallet. Each payment moves real funds and is verified
          on-chain before access is granted. Crypto payments are one-off and do not
          auto-renew.
        </li>
      </ul>

      <h2>3. How access works</h2>
      <p>
        Once your payment is confirmed, your account is granted access to the plan
        you paid for. Card/UPI/netbanking subscriptions renew automatically each
        28-day cycle until you cancel. Crypto payments grant access for a single
        28-day cycle with no hidden recurring charge — you pay again to continue.
      </p>

      <h2>4. Renewals &amp; cancellation</h2>
      <p>
        <strong>Card, UPI, or netbanking:</strong> your subscription renews
        automatically each cycle. To cancel, email{" "}
        <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>{" "}
        and we&apos;ll stop future charges; your paid access continues until the end of
        the cycle you already paid for, then reverts to Free.
      </p>
      <p>
        <strong>Crypto:</strong> because these payments are non-custodial, we cannot
        and do not auto-charge you. To continue after a cycle ends, you make another
        payment. To “cancel”, simply don’t renew. A short grace period may apply
        around renewal for either method.
      </p>

      <h2>5. Refunds</h2>
      <p>
        Pro payments are generally <strong>non-refundable</strong> — cryptocurrency
        payments because they are irreversible and settled on a public blockchain,
        and card/UPI/netbanking payments because access is granted immediately on
        payment. That said, we want billing to be fair. We will review refund
        requests in cases such as:
      </p>
      <ul>
        <li>a duplicate charge or a clear overpayment;</li>
        <li>a verified technical error on our side that prevented you from receiving the access you paid for.</li>
      </ul>
      <p>
        To request a review, email{" "}
        <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>{" "}
        within <strong>7 days</strong> of the payment with your payment reference (a
        Razorpay payment ID, or your transaction signature for crypto payments).
        Approved refunds for card/UPI/netbanking payments are issued back to the
        original payment method via Razorpay; approved refunds for crypto payments
        are issued in the same asset to the originating wallet where possible.
        Network and processing fees are non-refundable.
      </p>

      <h2>6. Price changes</h2>
      <p>
        We may change plan pricing over time. Any change applies to future cycles
        only — never retroactively to a cycle you have already paid for.
      </p>

      <h2>7. Contact</h2>
      <p>
        Billing questions? Email{" "}
        <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a> or
        visit our <a href="/contact">Contact page</a>.
      </p>
    </article>
  );
}
