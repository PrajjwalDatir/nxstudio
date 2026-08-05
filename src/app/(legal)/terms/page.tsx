import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";

const UPDATED = "July 26, 2026";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that govern your use of nxstudio — accounts, acceptable use, your content, AI-generated output, Pro billing, and liability.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <article className="legal-prose">
      <p className="text-sm text-muted-foreground">Last updated: {UPDATED}</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Terms of Service</h1>
      <p className="mt-4">
        These Terms govern your use of {siteConfig.name} ({siteConfig.legalEntity},
        “we”, “us”). By creating an account or using the service, you agree to these
        Terms. If you do not agree, do not use nxstudio.
      </p>

      <h2>1. What nxstudio is</h2>
      <p>
        nxstudio is a planning tool for founders. It turns a product brief into a
        derived tech stack and a compiled “build prompt” intended for use with
        third-party AI coding agents. nxstudio helps you plan and prompt — it does
        not itself write, run, or deploy your application code.
      </p>

      <h2>2. Your account</h2>
      <p>
        You sign in with GitHub. You are responsible for the activity under your
        account and for keeping your GitHub credentials secure. You must be at
        least 16 years old to use nxstudio.
      </p>

      <h2>3. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>use nxstudio for anything unlawful, harmful, or infringing;</li>
        <li>attempt to disrupt, overload, or reverse-engineer the service;</li>
        <li>access another user’s account or data without authorization;</li>
        <li>resell or redistribute the service without our written permission.</li>
      </ul>

      <h2>4. Your content</h2>
      <p>
        You own the briefs and other content you create in nxstudio. You grant us a
        limited license to store and process that content solely to operate and
        provide the service to you. See our{" "}
        <a href="/privacy">Privacy Policy</a> for how we handle your data.
      </p>

      <h2>5. AI-generated output</h2>
      <p>
        Tech-stack recommendations and build prompts are generated suggestions
        provided <strong>“as is”</strong>. They may be incomplete or imperfect. You
        are responsible for reviewing any output before relying on it, and for
        whatever your AI coding agent produces from it. nxstudio makes no warranty
        that generated output is fit for a particular purpose, secure, or
        error-free.
      </p>

      <h2>6. Pro subscription &amp; billing</h2>
      <p>
        nxstudio offers a free tier and a paid “Pro” plan billed per 28-day cycle in
        cryptocurrency (USDC/USDT) on Solana. Billing, access, and cancellation are
        described in our <a href="/refund">Refunds &amp; Billing Policy</a>, which
        forms part of these Terms.
      </p>

      <h2>7. Intellectual property</h2>
      <p>
        The nxstudio name, brand, software, and design are owned by us and protected
        by applicable law. These Terms do not grant you any right to our trademarks
        or software beyond the right to use the service as intended.
      </p>

      <h2>8. Third-party services</h2>
      <p>
        nxstudio relies on and integrates with third parties (including GitHub,
        Supabase, Vercel, the Solana network, and the AI coding agents you choose to
        use). Your use of those services is governed by their own terms, and we are
        not responsible for them.
      </p>

      <h2>9. Disclaimers &amp; limitation of liability</h2>
      <p>
        The service is provided “as is” and “as available”, without warranties of
        any kind. To the maximum extent permitted by law, we are not liable for any
        indirect, incidental, or consequential damages, or for any loss arising from
        your use of generated output or third-party services. Our total liability
        for any claim relating to the service will not exceed the amount you paid us
        in the 28 days before the claim.
      </p>

      <h2>10. Termination</h2>
      <p>
        You may stop using nxstudio at any time. We may suspend or terminate access
        if you breach these Terms or use the service in a way that risks harm to us
        or other users.
      </p>

      <h2>11. Governing law</h2>
      <p>
        These Terms are governed by the laws of India, without regard to conflict of
        law rules. Courts located in India will have exclusive jurisdiction over any
        dispute, unless mandatory local law provides otherwise.
      </p>

      <h2>12. Changes</h2>
      <p>
        We may update these Terms from time to time. Changes take effect when
        posted, as reflected by the “Last updated” date above. Continued use of
        nxstudio means you accept the updated Terms.
      </p>

      <h2>13. Contact</h2>
      <p>
        Questions? Email{" "}
        <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a> or
        visit our <a href="/contact">Contact page</a>. Learn more about who runs
        nxstudio on the <a href="/about">About page</a>.
      </p>
    </article>
  );
}
