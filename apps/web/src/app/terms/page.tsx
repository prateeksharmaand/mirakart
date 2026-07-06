import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Mirakart terms and conditions of use.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-gutter py-14">
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-foreground-muted">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <span>/</span>
        <span className="text-foreground">Terms &amp; Conditions</span>
      </nav>

      <h1 className="mb-8 text-3xl font-bold text-foreground">Terms &amp; Conditions</h1>

      <div className="prose prose-sm max-w-none space-y-6 text-sm leading-relaxed text-foreground-muted">
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">1. Acceptance of Terms</h2>
          <p>
            By accessing and using Mirakart, you accept and agree to be bound by the terms and conditions
            set out below. If you do not agree to these terms, please do not use our platform.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">2. Use of the Platform</h2>
          <p>
            You agree to use Mirakart only for lawful purposes and in a manner that does not infringe the
            rights of others or restrict their use and enjoyment of the platform. Prohibited activities
            include posting false or misleading content and engaging in fraudulent transactions.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">3. Orders and Payments</h2>
          <p>
            All orders placed through Mirakart are subject to acceptance by the relevant merchant. We
            reserve the right to refuse or cancel any order at our discretion. Payment must be made in
            full at the time of purchase.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">4. Returns and Refunds</h2>
          <p>
            Our returns policy allows you to request a return within 30 days of delivery for most items.
            Please review the individual merchant's return policy for specific conditions. Refunds are
            processed within 5–7 business days of receiving the returned item.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">5. Intellectual Property</h2>
          <p>
            All content on Mirakart, including text, graphics, logos, and images, is the property of
            Mirakart or its content suppliers and is protected by applicable intellectual property laws.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">6. Limitation of Liability</h2>
          <p>
            Mirakart shall not be liable for any indirect, incidental, or consequential damages arising
            from your use of the platform. Our total liability to you shall not exceed the amount paid
            for the specific order giving rise to the claim.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">7. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Continued use of the platform after
            changes constitutes your acceptance of the revised terms.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">8. Contact</h2>
          <p>
            For any questions regarding these terms, please contact us at{" "}
            <a href="mailto:support@mirakart.com" className="text-primary hover:underline">
              support@mirakart.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
