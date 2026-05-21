"use client";

import { useState, useEffect, useCallback } from "react";
import { Copy, X, Check, FileDown, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ToutiaoData {
  title: string;
  content: string;
  summary: string;
  imageBriefs: string[];
  tags: string[];
  wordCount: number;
}

interface MarkdownData {
  markdown: string;
  title: string;
}

export function ScriptLabExportDialog({
  projectId,
  onClose,
}: {
  projectId: string;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"toutiao" | "markdown">("toutiao");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data cache
  const [toutiaoData, setToutiaoData] = useState<ToutiaoData | null>(null);
  const [markdownData, setMarkdownData] = useState<MarkdownData | null>(null);

  // Copy success indicator states
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const fetchExportData = useCallback(async (format: "toutiao" | "markdown") => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/export?format=${format}`);
      const data = await res.json();
      if (data.success) {
        if (format === "toutiao") {
          setToutiaoData(data.data);
        } else {
          setMarkdownData(data.data);
        }
      } else {
        throw new Error(data.error?.message || "Failed to load export data");
      }
    } catch (err) {
      const error = err as Error;
      console.error(error);
      setError(error.message || "无法拉取文章发布包，请确保主稿已生成并处于激活状态。");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchExportData(activeTab);
  }, [activeTab, fetchExportData]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const triggerCopy = async (text: string, sectionKey: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(sectionKey);
      setTimeout(() => setCopiedSection(null), 1800);
    } catch (err) {
      console.error("Clipboard copy failed", err);
    }
  };

  const handleCopyAllToutiao = () => {
    if (!toutiaoData) return;
    const fullPack = [
      `【标题】\n${toutiaoData.title}`,
      `【摘要/简介】\n${toutiaoData.summary}`,
      `【正文】\n${toutiaoData.content}`,
      `【标签】\n${toutiaoData.tags.map((t) => `#${t}`).join(" ")}`,
    ].join("\n\n");
    triggerCopy(fullPack, "all-toutiao");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="导出发布包"
    >
      <div
        className="w-full max-w-2xl bg-[var(--surface-solid)] rounded-[var(--ios-radius-lg)] shadow-2xl flex flex-col max-h-[85vh] animate-scale-in border border-[var(--border-soft)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-6 py-4">
          <div className="flex items-center gap-2">
            <FileDown className="size-5 text-[var(--accent)]" />
            <span className="font-semibold text-base text-[var(--text-1)]">导出并一键发布包</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-[var(--surface-muted)] text-[var(--text-2)] transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Formats Switcher */}
        <div className="flex bg-[var(--surface-muted)] p-1 m-4 rounded-[var(--ios-radius-md)] border border-[var(--border-soft)]">
          <button
            onClick={() => setActiveTab("toutiao")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-[var(--ios-radius-sm)] transition-all ${
              activeTab === "toutiao"
                ? "bg-[var(--surface-solid)] text-[var(--text-1)] shadow-xs"
                : "text-[var(--text-3)] hover:text-[var(--text-2)]"
            }`}
          >
            今日头条分栏格式 (Toutiao)
          </button>
          <button
            onClick={() => setActiveTab("markdown")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-[var(--ios-radius-sm)] transition-all ${
              activeTab === "markdown"
                ? "bg-[var(--surface-solid)] text-[var(--text-1)] shadow-xs"
                : "text-[var(--text-3)] hover:text-[var(--text-2)]"
            }`}
          >
            通用 Markdown 格式
          </button>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-sm text-[var(--text-2)] flex flex-col items-center justify-center gap-2">
              <div className="size-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
              正在打包编译文章发布包...
            </div>
          ) : error ? (
            <div className="rounded-lg bg-[var(--danger-bg)] p-4 text-sm text-[var(--danger-text)] text-center">
              <p className="font-semibold">{error}</p>
              <Button onClick={() => fetchExportData(activeTab)} variant="secondary" className="mt-4 h-9 text-xs px-4">
                重试加载
              </Button>
            </div>
          ) : activeTab === "toutiao" && toutiaoData ? (
            <div className="space-y-4">
              {/* Copy all helper box */}
              <div className="flex items-center justify-between bg-[var(--accent-soft)] border border-[var(--accent-soft)] rounded-lg p-3 text-xs text-[var(--accent-strong)]">
                <span>头条发布需要将标题、摘要、正文分别填入创作者后台，可使用分栏复制。</span>
                <Button
                  onClick={handleCopyAllToutiao}
                  variant="primary"
                  className="h-8 text-xs px-3 rounded-lg flex items-center gap-1.5"
                >
                  {copiedSection === "all-toutiao" ? (
                    <>
                      <Check className="size-3.5" />
                      已复制整包
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      一键复制整包
                    </>
                  )}
                </Button>
              </div>

              {/* Title Section */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-[var(--text-2)]">文章标题 (建议在创作者平台直接使用)</span>
                  <button
                    onClick={() => triggerCopy(toutiaoData.title, "title")}
                    className="text-xs text-[var(--accent)] hover:underline inline-flex items-center gap-1"
                  >
                    {copiedSection === "title" ? (
                      <>
                        <Check className="size-3 text-[var(--ok-text)]" />
                        <span className="text-[var(--ok-text)]">已复制</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3" />
                        复制标题
                      </>
                    )}
                  </button>
                </div>
                <input
                  type="text"
                  readOnly
                  value={toutiaoData.title}
                  className="w-full h-10 px-3 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-muted)] text-sm text-[var(--text-1)] focus:outline-none"
                />
              </div>

              {/* Summary Section */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-[var(--text-2)]">摘要 (Abstract / 封底文案)</span>
                  <button
                    onClick={() => triggerCopy(toutiaoData.summary, "summary")}
                    className="text-xs text-[var(--accent)] hover:underline inline-flex items-center gap-1"
                  >
                    {copiedSection === "summary" ? (
                      <>
                        <Check className="size-3 text-[var(--ok-text)]" />
                        <span className="text-[var(--ok-text)]">已复制</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3" />
                        复制摘要
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={toutiaoData.summary}
                  rows={2}
                  className="w-full p-3 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-muted)] text-xs text-[var(--text-1)] focus:outline-none leading-5"
                />
              </div>

              {/* Content Body Section */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-[var(--text-2)]">
                    正文主稿 ({toutiaoData.wordCount} 字，已清除 Markdown 格式干扰)
                  </span>
                  <button
                    onClick={() => triggerCopy(toutiaoData.content, "content")}
                    className="text-xs text-[var(--accent)] hover:underline inline-flex items-center gap-1"
                  >
                    {copiedSection === "content" ? (
                      <>
                        <Check className="size-3 text-[var(--ok-text)]" />
                        <span className="text-[var(--ok-text)]">已复制正文</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3" />
                        复制正文
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={toutiaoData.content}
                  rows={10}
                  className="w-full p-3 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-muted)] text-xs text-[var(--text-1)] focus:outline-none leading-6 font-sans resize-none"
                />
              </div>

              {/* Tags Section */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-[var(--text-2)]">推荐发布标签</span>
                  <button
                    onClick={() => triggerCopy(toutiaoData.tags.map((t) => `#${t}`).join(" "), "tags")}
                    className="text-xs text-[var(--accent)] hover:underline inline-flex items-center gap-1"
                  >
                    {copiedSection === "tags" ? (
                      <>
                        <Check className="size-3 text-[var(--ok-text)]" />
                        <span className="text-[var(--ok-text)]">已复制</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3" />
                        复制标签
                      </>
                    )}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-muted)] min-h-10">
                  {toutiaoData.tags.length > 0 ? (
                    toutiaoData.tags.map((tag) => (
                      <span key={tag} className="text-xs font-medium text-[var(--accent)] bg-[var(--accent-soft)] px-2 py-0.5 rounded-full">
                        #{tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[var(--text-3)]">无标签建议</span>
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === "markdown" && markdownData ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-[var(--surface-muted)] rounded-lg p-3 text-xs text-[var(--text-2)]">
                <span>可以直接粘贴到掘金、简书、Notion等支持 Markdown 的排版器。</span>
                <Button
                  onClick={() => triggerCopy(markdownData.markdown, "markdown")}
                  variant="primary"
                  className="h-8 text-xs px-3 rounded-lg flex items-center gap-1.5"
                >
                  {copiedSection === "markdown" ? (
                    <>
                      <Check className="size-3.5" />
                      已复制 Markdown
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      一键复制 Markdown
                    </>
                  )}
                </Button>
              </div>

              <textarea
                readOnly
                value={markdownData.markdown}
                rows={16}
                className="w-full p-4 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-muted)] text-xs text-[var(--text-1)] focus:outline-none leading-6 font-mono resize-none"
              />
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border-soft)] px-6 py-4 flex justify-between bg-[var(--surface-muted)] rounded-b-[var(--ios-radius-lg)]">
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-3)] font-medium">
            <CheckCircle2 className="size-4 text-[var(--sage)]" />
            所有稿件格式已过质量屏障 (Quality Gate)
          </div>
          <Button variant="secondary" onClick={onClose}>
            关闭
          </Button>
        </div>
      </div>
    </div>
  );
}
