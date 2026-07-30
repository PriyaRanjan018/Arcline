import type { Metadata } from "next";
import { Outfit, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import ShellLayout from "@/components/shell/ShellLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import SplashScreen from "@/components/shared/SplashScreen";

// ── Fonts ──────────────────────────────────────────────────────────
// Outfit: friendly geometric sans — headings & display
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// Inter: warm, social body font (used by Twitter, Notion, Linear)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
  display: "swap",
});

// IBM Plex Mono: kept for genuinely code-like content only
const ibmMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-mono",
  weight: ["400", "500"],
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
