import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn more about Mirakart.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-gutter py-14">
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-foreground-muted">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <span>/</span>
        <span className="text-foreground">About Us</span>
      </nav>

      <h1 className="mb-8 text-3xl font-bold text-foreground">About Us</h1>

      <div className="prose prose-sm max-w-none space-y-6 text-sm leading-relaxed text-foreground-muted">
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">Who We Are</h2>
          <p>
            Mirakart is an online marketplace connecting shoppers with thousands of verified sellers across a
            wide range of categories. Our mission is to make quality products accessible, affordable, and easy
            to discover.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">What We Offer</h2>
          <p>
            From everyday essentials to unique finds, our sellers list new products daily. We handle secure
            payments, buyer protection, and reliable delivery so you can shop with confidence.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">Our Commitment</h2>
          <p>
            We're committed to great customer service, fast support, and a transparent returns process. If you
            ever have questions about an order, our team is available to help.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">Get in Touch</h2>
          <p>
            Have a question or feedback for us? Reach out at{" "}
            <a href="mailto:support@mirakart.com" className="text-primary hover:underline">
              support@mirakart.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
