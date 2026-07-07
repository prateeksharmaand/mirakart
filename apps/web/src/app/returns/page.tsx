import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Returns Policy",
  description: "Mirakart returns and refunds policy.",
};

export default function ReturnsPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-gutter py-14">
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-foreground-muted">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <span>/</span>
        <span className="text-foreground">Returns Policy</span>
      </nav>

      <h1 className="mb-8 text-3xl font-bold text-foreground">Returns Policy</h1>

      <div className="prose prose-sm max-w-none space-y-6 text-sm leading-relaxed text-foreground-muted">
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">1. Return Window</h2>
          <p>
            Most items purchased on Mirakart can be returned within 30 days of delivery. Some categories
            (e.g., perishables, personal care items) may have shorter or no return windows — check the
            individual product page for details.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">2. Condition of Returned Items</h2>
          <p>
            Items must be unused, in their original packaging, and include all tags and accessories to be
            eligible for a return. Items showing signs of use or damage may be refused.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">3. How to Start a Return</h2>
          <p>
            Sign in to your account, go to{" "}
            <Link href="/account/orders" className="text-primary hover:underline">My Orders</Link>, and
            select the item you'd like to return. Follow the prompts to schedule a pickup or drop-off.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">4. Refunds</h2>
          <p>
            Once your returned item is received and inspected, refunds are processed to your original payment
            method within 5–7 business days.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">5. Exchanges</h2>
          <p>
            If you'd like a different size or color, request a return and place a new order — we don't
            currently support direct exchanges.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">6. Need Help?</h2>
          <p>
            Contact our support team at{" "}
            <a href="mailto:support@mirakart.com" className="text-primary hover:underline">
              support@mirakart.com
            </a>{" "}
            for help with any return.
          </p>
        </section>
      </div>
    </div>
  );
}
