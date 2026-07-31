import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileNav } from "@/components/mobile-nav";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });

export const metadata: Metadata = {
  title: { default: "HanziWork — Tiếng Trung cho người đi làm", template: "%s | HanziWork" },
  description: "Học tiếng Trung chuyên ngành theo tình huống thực tế tại nơi làm việc.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi" className={geist.variable}><body><SiteHeader />{children}<SiteFooter /><MobileNav /></body></html>;
}
