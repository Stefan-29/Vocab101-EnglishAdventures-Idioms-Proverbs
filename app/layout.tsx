import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "English Adventures",
    template: "%s | English Adventures",
  },
  description: "Modern English idioms and proverbs learning app for fast exploration, study, and content management.",
  keywords: ["english idioms", "english proverbs", "language learning", "vocabulary"],
  openGraph: {
    title: "English Adventures",
    description: "Explore idioms and proverbs with a fast, modern learning experience.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "English Adventures",
    description: "Explore idioms and proverbs with a fast, modern learning experience.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
