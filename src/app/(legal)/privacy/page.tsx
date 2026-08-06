import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <article className="legal-prose max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
      
      <h2>1. What We Collect</h2>
      <ul>
        <li><strong>GitHub Profile:</strong> Email, username, and avatar for authentication.</li>
        <li><strong>Your Briefs:</strong> The project details you type in.</li>
        <li><strong>Payments:</strong> Subscription status from Razorpay (we don&apos;t see your card details) or on-chain transaction hashes for crypto.</li>
      </ul>

      <h2>2. How We Use It</h2>
      <p>
        Strictly to run the service: keeping you signed in, generating your architecture, and verifying your Pro status.
      </p>

      <h2>3. Who We Share It With</h2>
      <p>
        Only the infrastructure providers required to operate nxstudio:
      </p>
      <ul>
        <li><strong>Supabase</strong> (Database & Auth)</li>
        <li><strong>Vercel</strong> (Hosting)</li>
        <li><strong>Razorpay</strong> (Fiat payments)</li>
        <li><strong>Solana Network</strong> (Public ledger for crypto payments)</li>
      </ul>

      <h2>4. Your Rights</h2>
      <p>
        You can request to view, export, or delete your data at any time by emailing <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>. Note that on-chain crypto payment records are permanent and public.
      </p>
    </article>
  );
}
