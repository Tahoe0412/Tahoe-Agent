"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE_KEY, LOCALE_STORAGE_KEY, type Locale } from "@/lib/locale-copy";

const options: Array<{ value: Locale; label: string; hint: string }> = [
  { value: "zh", label: "中文", hint: "默认以中文展示，少量保留必要英文术语。" },
  { value: "en", label: "English", hint: "Switch the main workspace copy to English." },
];

export function LanguageSettings({ initialLocale }: { initialLocale: Locale }) {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>(initialLocale);

  useEffect(() => {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === "zh" || stored === "en") {
      setLocale(stored);
      document.cookie = `${LOCALE_COOKIE_KEY}=${stored}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.lang = stored === "en" ? "en" : "zh-CN";
    }
  }, []);

  function updateLocale(nextLocale: Locale) {
    setLocale(nextLocale);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    document.cookie = `${LOCALE_COOKIE_KEY}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = nextLocale === "en" ? "en" : "zh-CN";
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        {options.map((option) => {
          const active = option.value === locale;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => updateLocale(option.value)}
              className={`rounded-[22px] border p-4 text-left transition ${
                active
                  ? "theme-panel-strong border-transparent"
                  : "border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface-solid)]"
              }`}
            >
              <div className={`text-sm font-semibold ${active ? "text-[var(--text-inverse)]" : "text-[var(--text-1)]"}`}>{option.label}</div>
              <div className={`mt-2 text-sm leading-6 ${active ? "text-[color:rgba(246,240,232,0.76)]" : "text-[var(--text-2)]"}`}>{option.hint}</div>
            </button>
          );
        })}
      </div>
      <div className="theme-panel-muted rounded-[18px] px-4 py-3 text-sm leading-6 text-[var(--text-2)]">
        语言偏好会保存在当前浏览器，并在刷新后同步到主要页面和导航文案。
      </div>
    </div>
  );
}
