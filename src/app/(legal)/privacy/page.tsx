import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";

const UPDATED = "August 6, 2026";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How nxstudio collects, uses, and protects your data — including GitHub sign-in, the briefs you create, and card, UPI, or on-chain crypto payments.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <article className="legal-prose">
      <p className="text-sm text-muted-foreground">Last updated: {UPDATED}</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
      <p className="mt-4">
        This policy explains what {siteConfig.name} ({siteConfig.legalEntity}, “we”,
        “us”) collects, why, and the choices you have. It applies to{" "}
        <a href={siteConfig.url}>{siteConfig.url.replace("https://", "")}</a> and the
        nxstudio web app.
      </p>

      <h2>1. Information we collect</h2>
      <h3>Account information</h3>
      <p>
        You sign in with GitHub via our authentication provider (Supabase). We
        receive your email address, GitHub username, display name, and avatar. We
        never see or store your GitHub password.
      </p>
      <h3>Content you create</h3>
      <p>
        The product briefs, projects, tech-stack selections, checklists, custom
        stages, and build prompts you create in nxstudio are stored against your
        account so we can provide the service.
      </p>
      <h3>Payment information</h3>
      <p>
        Pro can be paid by card, UPI, or netbanking, or in cryptocurrency (USDC/USDT)
        on the Solana network.
      </p>
      <p>
        Card, UPI, and netbanking payments are processed by{" "}
        <strong>Razorpay</strong>. Razorpay collects and stores your payment details
        directly — we never see or store your card number, UPI ID, or bank
        credentials. We receive only the payment and subscription status needed to
        grant access.
      </p>
      <p>
        For crypto payments, we record the transaction signature, the paying wallet
        address, the amount, and the timestamp so we can verify your payment
        on-chain and grant access. We do <strong>not</strong> collect or store card
        or bank details for crypto payments.
      </p>
      <h3>Technical data</h3>
      <p>
        Like most sites, our hosting and infrastructure providers process standard
        technical data (IP address, browser and device type, and request logs) for
        security, reliability, and abuse prevention.
      </p>
      <h3>Cookies</h3>
      <p>
        We use a single essential, http-only session cookie to keep you signed in.
        We do not use third-party advertising or cross-site tracking cookies.
      </p>

      <h2>2. How we use your information</h2>
      <ul>
        <li>To provide, operate, and secure nxstudio;</li>
        <li>To authenticate you and keep your session active;</li>
        <li>To verify Pro payments and manage access to paid features;</li>
        <li>To respond to your support requests;</li>
        <li>To improve the product and fix problems;</li>
        <li>To comply with legal obligations.</li>
      </ul>

      <h2>3. How we share information</h2>
      <p>
        We do not sell your personal information. We share data only with the
        service providers that make nxstudio work, and only as needed:
      </p>
      <ul>
        <li><strong>Supabase</strong> — authentication and database;</li>
        <li><strong>GitHub</strong> — sign-in (OAuth);</li>
        <li><strong>Vercel</strong> — application hosting;</li>
        <li>
          <strong>Razorpay</strong> — to process card, UPI, and netbanking payments
          and manage subscriptions;
        </li>
        <li>
          <strong>Solana network &amp; RPC providers</strong> — to verify crypto
          payments. Note that blockchain transactions are public and permanent.
        </li>
      </ul>
      <p>
        We may also disclose information if required by law, or to protect the
        rights, safety, and security of our users and the service.
      </p>

      <h2>4. Blockchain payments are public</h2>
      <p>
        Payments made on Solana are recorded on a public, immutable ledger. We
        cannot alter or delete on-chain records, and anyone can view them. Only pay
        from a wallet you are comfortable associating with your account.
      </p>

      <h2>5. Data retention</h2>
      <p>
        We keep your account and content for as long as your account is active.
        You can ask us to delete your account and associated content at any time by
        emailing <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>.
        Certain records may be retained where required for legal or security
        reasons, and on-chain payment records cannot be deleted.
      </p>

      <h2>6. Your rights</h2>
      <p>
        Depending on where you live, you may have the right to access, correct,
        export, or delete your personal data, and to object to or restrict certain
        processing. To exercise any of these, contact us at{" "}
        <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>.
      </p>

      <h2>7. Security</h2>
      <p>
        Data is encrypted in transit (HTTPS). Access to your data is protected by
        row-level security and http-only session cookies. No system is perfectly
        secure, but we take reasonable measures to protect your information.
      </p>

      <h2>8. Children</h2>
      <p>
        nxstudio is not directed to children under 16, and we do not knowingly
        collect their personal information.
      </p>

      <h2>9. Changes to this policy</h2>
      <p>
        We may update this policy from time to time. Material changes will be
        reflected by the “Last updated” date above, and where appropriate we will
        provide additional notice.
      </p>

      <h2>10. Contact</h2>
      <p>
        Questions about privacy? Email{" "}
        <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a> or
        visit our <a href="/contact">Contact page</a>.
      </p>
    </article>
  );
}
