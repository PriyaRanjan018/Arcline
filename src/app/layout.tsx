import type { Metadata } from "next";
import { Playfair_Display, IBM_Plex_Sans, IBM_Plex_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import ShellLayout from "@/components/shell/ShellLayout";
import { AuthProvider } from "@/contexts/AuthContext";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "900"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-body",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-mono",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["700"],
  style: ["italic"],
  variable: "--font-logo",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://arclinee.vercel.app"),
  title: {
    default: "Arcline Platform",
    template: "%s | Arcline",
  },
  description: "Proof of Work. NOT perfection. A brutalist platform for builders.",
  openGraph: {
    title: "Arcline Platform",
    description: "Proof of Work. NOT perfection. A brutalist platform for builders.",
    url: "https://arclinee.vercel.app",
    siteName: "Arcline",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Arcline Platform",
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
    <html lang="en">
      <body
        className={`${playfair.variable} ${plexSans.variable} ${plexMono.variable} ${cormorant.variable} bg-bg text-text1 min-h-screen`}
      >
        <AuthProvider>
          <ShellLayout>{children}</ShellLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
