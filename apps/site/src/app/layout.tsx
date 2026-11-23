import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// The two Google fonts are exposed as CSS variables on <html>. The scaffold does
// not yet map Tailwind's `font-sans` / `font-mono` utilities to these variables.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Browser-tab metadata: the Veyra title and public description. */
export const metadata: Metadata = {
  title: "Veyra",
  description:
    "Veyra is a free and open-source platform to discover, test, and download Discord bots. Explore community-built bots, access their source code, and get started with ease.",
};

/**
 * Root layout wrapped around every route: imports the global stylesheet, mounts
 * the font CSS variables on `<html>`, and lays `<body>` out as a full-height
 * column so pages can stretch to the viewport.
 *
 * @param props - Render props provided by Next.js.
 * @param props.children - The active route's rendered content.
 * @returns The `<html>` shell that Next.js hydrates.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
