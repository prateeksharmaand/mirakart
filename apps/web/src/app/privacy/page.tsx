import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy & Cookies Policy",
  description: "Mirakart privacy policy and cookie usage.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-gutter py-14">
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-foreground-muted">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <span>/</span>
        <span className="text-foreground">Privacy Policy</span>
      </nav>

      <h1 className="mb-8 text-3xl font-bold text-foreground">Privacy &amp; Cookies Policy</h1>

      <div className="prose prose-sm max-w-none space-y-6 text-sm leading-relaxed text-foreground-muted">
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">1. Information We Collect</h2>
          <p>
            We collect information you provide directly to us when creating an account, placing an order,
            or contacting support — including your name, email address, shipping address, and payment details.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">2. How We Use Your Information</h2>
          <p>
            We use the information we collect to process transactions, send order confirmations, respond to
            enquiries, improve our services, and send promotional communications (where you have opted in).
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">3. Cookies</h2>
          <p>
            We use cookies and similar tracking technologies to track activity on our platform and hold
            certain information. Cookies are files with a small amount of data sent to your browser.
            You can instruct your browser to refuse all cookies, but some parts of the site may not function
            correctly without them.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">4. Data Sharing</h2>
          <p>
            We do not sell, trade, or otherwise transfer your personally identifiable information to third
            parties except as necessary to fulfil your orders (e.g., couriers, payment processors) or as
            required by law.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">5. Your Rights</h2>
          <p>
            You have the right to access, correct, or delete your personal data at any time. To exercise
            these rights, please contact us at{" "}
            <a href="mailto:support@mirakart.com" className="text-primary hover:underline">
              support@mirakart.com
            </a>.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">6. Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of any changes by
            posting the new policy on this page.
          </p>
        </section>
      </div>
    </div>
  );
}
