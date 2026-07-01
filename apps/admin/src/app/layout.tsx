import type { Metadata } from "next";
import { Jost } from "next/font/google";
import "./globals.css";
import { Providers } from "../components/providers";

const jost = Jost({ subsets: ["latin"], variable: "--font-jost", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Mirakart Admin", template: "%s | Mirakart Admin" },
  description: "Master admin portal for the Mirakart multi-vendor platform.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jost.variable}>
      <body className="font-sans bg-gray-50 text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
