import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from 'react-hot-toast';
import { GoogleMapsScript } from '@/components/cafes/CafeMap';

export const metadata: Metadata = {
  title: "沖縄トライアスロンコミュニティ",
  description: "沖縄のトライアスロン、サイクリング、ランニングを愛する人々のためのコミュニティサイト",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="bg-white dark:bg-black">
      <head>
        <meta name="theme-color" content="#ffffff" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <GoogleMapsScript />
      </head>
      <body className="antialiased min-h-screen flex flex-col bg-white dark:bg-black" suppressHydrationWarning>
        <AuthProvider>
          <Toaster />
          <Navigation />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
