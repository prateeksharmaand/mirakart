import type { Metadata } from "next";
import { Jost } from "next/font/google";
import "./globals.css";
import { Providers } from "../components/providers";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";
import { getCategories } from "../lib/api/catalog";
import type { Category } from "../types/catalog";

const jost = Jost({ subsets: ["latin"], variable: "--font-jost", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Mirakart",
    template: "%s | Mirakart",
  },
  description: "Shop from thousands of verified sellers on Mirakart.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const categories = (await getCategories(true).catch(() => [])) as Category[];

  return (
    <html lang="en" className={jost.variable}>
      <body className="flex min-h-screen flex-col bg-background font-sans text-foreground">
        <Providers>
          <SiteHeader categories={categories} />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
