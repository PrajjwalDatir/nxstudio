import type { Metadata } from "next";
import { siteConfig, pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  path: "/refund",
  title: "Refunds & Billing",
  description: `How billing, cancellations, and refunds work for ${siteConfig.name} Pro — card, UPI, and on-chain USDC/USDT.`,
});

export default function RefundPage() {
  return (
    <article className="legal-prose max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Refunds & Billing</h1>

      <h2>1. Pro Plan</h2>
      <p>
        Pro costs $10 per 28-day cycle and unlocks unlimited workspaces.
      </p>
      
      <h2>2. Payment Methods</h2>
      <ul>
        <li><strong>Fiat (Card/UPI):</strong> Processed securely by Razorpay. Auto-renews every 28 days.</li>
        <li><strong>Crypto (USDC/USDT):</strong> Verified on-chain via Solana. Does <em>not</em> auto-renew. You pay manually each cycle.</li>
      </ul>

      <h2>3. Cancellation</h2>
      <p>
        <strong>Fiat:</strong>{" "}
        {siteConfig.contactEmail ? (
          <>
            Email <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a> to stop future charges.
          </>
        ) : (
          "Contact support to stop future charges."
        )}{" "}
        You keep access until your current cycle ends.<br/>
        <strong>Crypto:</strong> Simply don&apos;t send the next payment.
      </p>

      <h2>4. Refunds</h2>
      <p>
        Because access is granted instantly and crypto transactions are irreversible, payments are <strong>non-refundable</strong>. However, if you experience a duplicate charge or technical failure preventing access, email us within 7 days.
      </p>
    </article>
  );
}
