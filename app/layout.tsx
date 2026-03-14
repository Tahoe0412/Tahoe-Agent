import type { Metadata } from "next";
import { ThemeScript } from "@/components/theme/theme-script";
import { getAppBaseUrl } from "@/lib/env";
import { getLocale } from "@/lib/locale";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tahoe — Marketing Intelligence Workspace",
  description: "品牌营销策略、内容生产与运营自动化工作台",
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
