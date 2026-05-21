"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, AlertTriangle, XCircle, RotateCcw, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QualityCheckItem {
  name: string;
  passed: boolean;
  score: number;
  message: string;
}

interface QualityCheckResult {
  passed: boolean;
  score: number;
  checks: QualityCheckItem[];
  suggestions: string[];
}

export function ScriptLabQualityCheck({
  title,
  content,
  direction,
}: {
  title: string;
  content: string;
  direction: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QualityCheckResult | null>(null);

  const runCheck = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/articles/quality-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          direction,
        }),
      });

      const data = await res.json();
      if (data.status === "ok") {
        setResult(data.data);
      } else {
        throw new Error(data.message || "Quality check request failed");
      }
    } catch (err) {
      const error = err as Error;
      console.error(error);
      setError(error.message || "无法连接到质量检查接口");
    } finally {
      setLoading(false);
    }
  }, [title, content, direction]);

  useEffect(() => {
    if (title && content && direction) {
      void runCheck();
    }
  }, [title, content, direction, runCheck]);

  const getScoreColorClass = (score: number) => {
    if (score >= 70) return "text-[var(--ok-text)]";
    if (score >= 55) return "text-[var(--warn-text)]";
    return "text-[var(--danger-text)]";
  };

  const getScoreBgClass = (score: number) => {
    if (score >= 70) return "bg-[var(--sage-soft)] border-[color:color-mix(in_srgb,var(--ok-text)_20%,transparent)]";
    if (score >= 55) return "bg-[var(--terracotta-soft)] border-[color:color-mix(in_srgb,var(--warn-text)_20%,transparent)]";
    return "bg-[var(--danger-bg)] border-[color:color-mix(in_srgb,var(--danger-text)_20%,transparent)]";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-3">
        <h4 className="text-sm font-semibold text-[var(--text-1)] flex items-center gap-1.5">
          <ShieldAlert className="size-4 text-[var(--accent)]" />
          成稿质量检查面盘 (Quality Gate)
        </h4>
        <button
          onClick={runCheck}
          disabled={loading}
          className="inline-flex items-center gap-1 text-xs text-[var(--text-2)] hover:text-[var(--accent)] disabled:opacity-50 transition"
          title="重新检查"
        >
          <RotateCcw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          重新运行
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-[var(--text-2)] flex flex-col items-center justify-center gap-2">
          <div className="size-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
          正在分析文章结构与禁用表达...
        </div>
      ) : error ? (
        <div className="rounded-lg bg-[var(--danger-bg)] p-4 text-sm text-[var(--danger-text)] flex items-start gap-2">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">检查出错</div>
            <div className="mt-1 text-xs leading-5">{error}</div>
            <Button onClick={runCheck} variant="secondary" className="mt-3 h-8 text-xs px-3">
              重试
            </Button>
          </div>
        </div>
      ) : result ? (
        <div className="space-y-5">
          {/* Dashboard Header: Big Score and Status */}
          <div className={`rounded-xl border p-4 flex items-center justify-between ${getScoreBgClass(result.score)}`}>
            <div>
              <div className="text-xs uppercase tracking-[0.12em] text-[var(--text-2)] font-medium">总评分数 (Score)</div>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className={`text-4xl font-extrabold tracking-tight ${getScoreColorClass(result.score)}`}>
                  {result.score}
                </span>
                <span className="text-sm text-[var(--text-3)] font-medium">/ 100</span>
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                result.passed
                  ? "bg-[var(--sage-soft)] text-[var(--ok-text)]"
                  : "bg-[var(--danger-bg)] text-[var(--danger-text)]"
              }`}>
                {result.passed ? (
                  <>
                    <CheckCircle2 className="size-3.5" />
                    建议发布 (PASSED)
                  </>
                ) : (
                  <>
                    <XCircle className="size-3.5" />
                    暂缓发布 (REJECTED)
                  </>
                )}
              </span>
              <div className="mt-1 text-xs text-[var(--text-2)]">
                {result.passed ? "文章基本符合账号风格规范" : "存在扣分项，建议根据下方提示微调"}
              </div>
            </div>
          </div>

          {/* Checklist Items */}
          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-[var(--text-2)]">指标明细 (Checks)</div>
            <div className="divide-y divide-[var(--border-soft)] rounded-lg border border-[var(--border-soft)] bg-[var(--surface-solid)]">
              {result.checks.map((check) => (
                <div key={check.name} className="flex items-start justify-between gap-4 p-3 text-sm">
                  <div className="flex gap-2.5 items-start min-w-0">
                    <span className="mt-0.5 shrink-0">
                      {check.passed ? (
                        <CheckCircle2 className="size-4 text-[var(--sage)]" />
                      ) : (
                        <AlertTriangle className={`size-4 ${check.score >= 50 ? "text-[var(--terracotta)]" : "text-[var(--danger-text)]"}`} />
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium text-[var(--text-1)]">{check.name}</div>
                      <div className="mt-0.5 text-xs text-[var(--text-2)] leading-5">{check.message}</div>
                    </div>
                  </div>
                  <span className={`shrink-0 font-mono text-xs font-bold ${getScoreColorClass(check.score)}`}>
                    {check.score} 分
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Optimizer Suggestions */}
          {result.suggestions.length > 0 && (
            <div className="rounded-lg border border-[color:color-mix(in_srgb,var(--warn-text)_18%,transparent)] bg-[var(--surface-solid)] p-4 space-y-2">
              <div className="text-xs font-bold text-[var(--warn-text)] flex items-center gap-1.5">
                <Sparkles className="size-3.5" />
                优化改善建议 (Suggestions)
              </div>
              <ul className="space-y-1.5 text-xs leading-5 text-[var(--text-2)]">
                {result.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="flex gap-1.5 items-start">
                    <span className="text-[var(--warn-text)] font-semibold shrink-0">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="py-8 text-center text-sm text-[var(--text-2)]">
          暂无检查数据。输入内容后系统将自动运行质量检查。
        </div>
      )}
    </div>
  );
}
