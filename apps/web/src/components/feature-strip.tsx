const FEATURES = [
  {
    title: "Free Shipping",
    desc: "Free shipping for orders above ₹999.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-10 w-10 text-foreground">
        <rect x="4" y="14" width="28" height="20" rx="2" />
        <path d="M32 18h6l6 8v8h-12V18z" />
        <circle cx="13" cy="36" r="3" />
        <circle cx="37" cy="36" r="3" />
        <path d="M8 22h14M8 27h10" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Money Guarantee",
    desc: "Within 30 days for an exchange.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-10 w-10 text-foreground">
        <rect x="6" y="10" width="28" height="28" rx="14" />
        <path d="M34 10c0 0 8 4 8 14s-8 14-8 14" strokeLinecap="round" />
        <path d="M20 18v2m0 8v2" strokeLinecap="round" />
        <path d="M17 20.5c0-1.4 1.3-2.5 3-2.5s3 1.1 3 2.5c0 1.3-1 2-3 2.5-2 .5-3 1.2-3 2.5C17 27 18.3 28 20 28s3-1 3-2.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Online Support",
    desc: "24/7 dedicated support team.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-10 w-10 text-foreground">
        <path d="M10 28c-2-3-3-6-3-10C7 11 14.3 4 24 4s17 7.2 17 14c0 7.7-7.6 14-17 14-2 0-3.8-.3-5.5-.9L8 34l2-6z" strokeLinejoin="round" />
        <rect x="18" y="16" width="12" height="8" rx="2" />
        <path d="M18 18h-2a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2M30 18h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2" />
      </svg>
    ),
  },
  {
    title: "Flexible Payment",
    desc: "Pay with multiple credit cards.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-10 w-10 text-foreground">
        <rect x="4" y="12" width="40" height="28" rx="3" />
        <path d="M4 20h40" strokeLinecap="round" />
        <path d="M10 28h8M10 33h5" strokeLinecap="round" />
        <rect x="32" y="26" width="8" height="10" rx="1" />
      </svg>
    ),
  },
];

export function FeatureStrip() {
  return (
    <div className="border-b border-border bg-background">
      <div className="mx-auto grid max-w-site grid-cols-2 divide-x divide-border md:grid-cols-4">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="flex items-center gap-4 px-6 py-6">
            <div className="shrink-0">{feature.icon}</div>
            <div>
              <p className="text-sm font-semibold text-foreground">{feature.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-primary">{feature.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
