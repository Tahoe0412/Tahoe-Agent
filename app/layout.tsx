import type { Metadata } from "next";
import { ThemeScript } from "@/components/theme/theme-script";
import { getAppBaseUrl } from "@/lib/env";
import { getLocale } from "@/lib/locale";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Video Research Orchestrator",
  description: "AI 视频前期调研与生产编排 MVP",
  metadataBase: new URL(getAppBaseUrl()),
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();

  return (
    <html lang={locale === "en" ? "en" : "zh-CN"} suppressHydrationWarning>
      <body>
        <ThemeScript />
        {children}
      </body>
    </html>
  );
}
