import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/contexts/AuthContext";

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
    <html lang="ja">
      <body className="antialiased min-h-screen flex flex-col" suppressHydrationWarning>
        <AuthProvider>
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
