import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist } from "next/font/google";
import "./globals.css";
import "./motion.css";
import "./responsive.css";
import "./white-backgrounds.css";
import { SiteHeader, SiteHeaderFallback } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileNav } from "@/components/mobile-nav";
import { LearnerAppShell } from "@/components/learner-app-shell";
import { getCurrentUser } from "@/lib/auth-session";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Himi Chinese — Tiếng Trung cho người đi làm", template: "%s | Himi Chinese" },
  description: "Học tiếng Trung chuyên ngành theo tình huống thực tế tại nơi làm việc.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  const shellUser = user ? {
    displayName: user.displayName,
    role: user.role,
    unreadNotificationCount: user.unreadNotificationCount,
  } : null;

  return <html lang="vi" className={geist.variable}><body>
    <Suspense fallback={<SiteHeaderFallback />}><SiteHeader /></Suspense>
    <Suspense fallback={<div className="standalone-route-shell">{children}</div>}><LearnerAppShell user={shellUser}>{children}</LearnerAppShell></Suspense>
    <SiteFooter />
    <MobileNav />
  </body></html>;
}
