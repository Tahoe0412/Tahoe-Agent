"use client";

import { useEffect, useState } from "react";
import { applyTheme, THEME_STORAGE_KEY, type ThemePreference } from "@/lib/theme";

const options: Array<{ value: ThemePreference; label: string; hint: string }> = [
  { value: "system", label: "跟随系统", hint: "自动切换浅色 / 深色" },
  { value: "light", label: "浅色模式", hint: "清爽明亮的 Tahoe 工作台" },
  { value: "dark", label: "深色模式", hint: "适合夜间和长时间工作" },
];

export function ThemeSettings() {
  const [theme, setTheme] = useState<ThemePreference>("system");

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      setTheme(stored);
      applyTheme(stored);
      return;
    }

    applyTheme("system");
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [theme]);

  function updateTheme(nextTheme: ThemePreference) {
    setTheme(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        {options.map((option) => {
          const active = option.value === theme;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => updateTheme(option.value)}
              className={`rounded-2xl border p-4 text-left transition-all ${
                active
                  ? "border-[var(--border-selected)] bg-[var(--surface-selected)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                  : "border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface-solid)] hover:border-[var(--border)]"
              }`}
            >
              <div className={`text-sm font-semibold ${active ? "text-[var(--accent-strong)]" : "text-[var(--text-1)]"}`}>{option.label}</div>
              <div className={`mt-2 text-sm leading-6 ${active ? "text-[var(--text-2)]" : "text-[var(--text-3)]"}`}>{option.hint}</div>
            </button>
          );
        })}
      </div>
      <div className="theme-panel-muted rounded-[18px] px-4 py-3 text-sm leading-6 text-[var(--text-2)]">
        当前主题偏好只保存在本地浏览器，不会影响数据库里的项目数据。默认推荐使用“跟随系统”。
      </div>
    </div>
  );
}
