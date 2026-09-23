import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SiteNav } from "@/components/SiteNav";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Beyond PayMe — HSBC HKD stablecoin fund settlement",
  description:
    "Concept demo for a licensed HKD stablecoin: subscribing and redeeming tokenised HKD money-market funds, with a delivery plan and user stories.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-paper-50 text-ink-900">
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
