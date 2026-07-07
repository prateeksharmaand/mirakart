import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dropshipping",
  description: "Sell on Mirakart with dropshipping — no inventory required.",
};

export default function DropshippingPage() {
  return (
    <div className="mx-auto max-w-3xl px-gutter py-14">
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-foreground-muted">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <span>/</span>
        <span className="text-foreground">Dropshipping</span>
      </nav>

      <h1 className="mb-8 text-3xl font-bold text-foreground">Dropshipping</h1>

      <div className="prose prose-sm max-w-none space-y-6 text-sm leading-relaxed text-foreground-muted">
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">Sell Without Holding Inventory</h2>
          <p>
            Mirakart's dropshipping program lets you list products from our verified suppliers on your own
            storefront. When a customer places an order, the supplier ships it directly — you never need to
            hold or handle stock.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">How It Works</h2>
          <p>
            Browse our supplier catalog, choose products to list, and set your own retail price. When an
            order comes in, we pass it to the supplier for fulfillment and you keep the margin between the
            wholesale and retail price.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">Why Partner With Us</h2>
          <p>
            Verified suppliers, reliable shipping times, and a dashboard that keeps you updated on stock
            levels and order status — so you can focus on growing your store.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">Get Started</h2>
          <p>
            Interested in becoming a dropshipping partner? Email{" "}
            <a href="mailto:support@mirakart.com" className="text-primary hover:underline">
              support@mirakart.com
            </a>{" "}
            and our merchant team will reach out with next steps.
          </p>
        </section>
      </div>
    </div>
  );
}
