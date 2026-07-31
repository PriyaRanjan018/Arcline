import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ShellLayout from "@/components/shell/ShellLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import SplashScreen from "@/components/shared/SplashScreen";

// ── Fonts ──────────────────────────────────────────────────────────
// Outfit: friendly geometric sans — headings & display
const outfit = localFont({
  src: "../../node_modules/@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2",
  variable: "--font-outfit",
  display: "swap",
});

// Inter: warm, social body font (used by Twitter, Notion, Linear)
const inter = localFont({
  src: "../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  display: "swap",
});

// IBM Plex Mono: kept for genuinely code-like content only
const ibmMono = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-ibm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://arclinee.vercel.app"),
  title: {
    default: "Arcline",
    template: "%s | Arcline",
  },
  description: "Proof of Work. NOT perfection. A brutalist platform for builders.",
  openGraph: {
    title: "Arcline",
    description: "Proof of Work. NOT perfection. A brutalist platform for builders.",
    url: "https://arclinee.vercel.app",
    siteName: "Arcline",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Arcline",
    description: "Proof of Work. NOT perfection. A brutalist platform for builders.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} ${ibmMono.variable}`}
    >
      <body className="bg-bg text-text1 min-h-screen">
        <SplashScreen />
        <AuthProvider>
          <ShellLayout>{children}</ShellLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
