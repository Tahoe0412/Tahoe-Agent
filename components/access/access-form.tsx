"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function AccessForm() {
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setPending(true);
    setError(null);

    const response = await fetch("/api/access", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    const payload = (await response.json()) as { success: boolean; error?: { message?: string } };
    if (!payload.success) {
      setError(payload.error?.message || "访问失败。");
      setPending(false);
      return;
    }

    const redirect = searchParams.get("redirect") || "/";
    window.location.assign(redirect);
  }

  return (
    <div className="theme-panel mx-auto max-w-xl space-y-6 rounded-[28px] p-8">
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-3)]">Preview Access</div>
        <div className="text-3xl font-semibold tracking-tight text-[var(--text-1)]">输入测试口令</div>
        <div className="text-sm leading-7 text-[var(--text-2)]">
          当前是受控测试版。输入访问口令后即可进入工作台，适合内部团队和受邀测试用户。
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--text-2)]">访问口令</label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="theme-input w-full rounded-2xl px-4 py-3 text-sm"
          placeholder="输入访问口令"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="button" onClick={() => void submit()} disabled={pending || password.trim().length === 0}>
          {pending ? "验证中..." : "进入测试版"}
        </Button>
        {error ? <div className="text-sm text-[var(--danger-text)]">{error}</div> : null}
      </div>
    </div>
  );
}
