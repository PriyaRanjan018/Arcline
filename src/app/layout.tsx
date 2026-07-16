import type { Metadata } from "next";
import "./globals.css";
import ShellLayout from "@/components/shell/ShellLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import SplashScreen from "@/components/shared/SplashScreen";

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-bg text-text1 min-h-screen">
        <SplashScreen />
        <AuthProvider>
          <ShellLayout>{children}</ShellLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
