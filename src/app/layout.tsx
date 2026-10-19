import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { DemoBanner } from "@/components/demo-banner";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "grantAgent — demo",
  description: "Interactive demo of grantAgent: weekly federal funding matches for faculty.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <DemoBanner />
        {children}
        <Toaster richColors closeButton />
      </body>
    </html>
  );
}
