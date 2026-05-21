"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, ExternalLink, FileText, X, Info, HelpCircle, Check, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PanelCard } from "@/components/ui/panel-card";
import { Tag } from "@/components/ui/tag";
import { Button } from "@/components/ui/button";
import { WorkspaceLayout } from "@/components/workspace/layout";
import { LoadingPanel, EmptyPanel } from "@/components/ui/state-panel";
import { ErrorNotice } from "@/components/ui/error-notice";

interface StyleInsight {
  avgWordCount: number;
  avgParagraphCount: number;
  commonOpeningPatterns: string[];
  titlePatterns: string[];
  toneKeywords: string[];
  sampleCount: number;
}

interface ArticleSample {
  id: string;
  account_direction: string;
  title: string;
  content: string;
  source_project_id?: string;
  source_url?: string;
  quality_score?: number;
  tags: string[];
  created_at: string;
}

interface SummaryGroup {
  direction: string;
  summary: StyleInsight | null;
  samples: ArticleSample[];
}

export default function ArticleSamplesPage() {
  const [groups, setGroups] = useState<SummaryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [selectedDirection, setSelectedDirection] = useState("AI快讯");

  // Modal / Drawer states
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedSampleForView, setSelectedSampleForView] = useState<ArticleSample | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formSourceUrl, setFormSourceUrl] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formQualityScore, setFormQualityScore] = useState(80);
  const [formDirection, setFormDirection] = useState("AI快讯");
  const [submitting, setSubmitting] = useState(false);

  // Inline delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  }, []);
  const [formError, setFormError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/article-samples");
      if (!res.ok) {
        throw new Error(`Failed to fetch article samples: ${res.statusText}`);
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setGroups(data.data);
      } else {
        throw new Error(data.error?.message || "Unknown error occurred");
      }
    } catch (err) {
      console.error(err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!formTitle.trim()) {
      setFormError("标题不能为空");
      return;
    }
    if (formContent.trim().length < 10) {
      setFormError("正文内容字数不能少于10个字");
      return;
    }

    setSubmitting(true);
    try {
      const tagsArray = formTags
        .split(/[，,]/)
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch("/api/article-samples", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountDirection: formDirection,
          title: formTitle.trim(),
          content: formContent.trim(),
          sourceUrl: formSourceUrl.trim() || undefined,
          tags: tagsArray,
          qualityScore: Number(formQualityScore),
          isExternal: true,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error?.message || "导入失败，请检查参数");
      }

      // Reset form and close
      setFormTitle("");
      setFormContent("");
      setFormSourceUrl("");
      setFormTags("");
      setFormQualityScore(80);
      setIsImportOpen(false);
      
      // Refresh list
      await fetchData();
    } catch (err) {
      const error = err as Error;
      setFormError(error.message || "请求发送失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirmId(null);
    try {
      const res = await fetch(`/api/article-samples/${id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error?.message || "删除失败");
      }
      showToast("样本已删除");
      await fetchData();
    } catch (err) {
      const error = err as Error;
      showToast(error.message || "网络请求失败，请稍后重试");
    }
  };

  // Close drawers on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (deleteConfirmId) {
          setDeleteConfirmId(null);
        } else if (isImportOpen) {
          setIsImportOpen(false);
        } else if (selectedSampleForView) {
          setSelectedSampleForView(null);
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [deleteConfirmId, isImportOpen, selectedSampleForView]);

  // Find the currently active group details
  const activeGroup = groups.find((g) => g.direction === selectedDirection) || {
    direction: selectedDirection,
    summary: null,
    samples: [],
  };

  return (
    <WorkspaceLayout locale="zh">
      <div className="space-y-6 xl:space-y-5">
        <PageHeader
          eyebrow="风格库 / Style Bank"
          title="文章样本库"
          description="管理写作方向的参考样本和风格印记。此处存储的文章样本将分析出语气特色与篇章结构，并提供给大模型作为起稿和最终润色的上下文约束。"
          action={
            <Button
              onClick={() => {
                setFormDirection(selectedDirection);
                setIsImportOpen(true);
              }}
              variant="primary"
              className="flex items-center gap-2"
            >
              <Plus className="size-4" />
              导入风格样本
            </Button>
          }
        />

        {error ? (
          <ErrorNotice error={error} onRetry={fetchData} />
        ) : loading ? (
          <LoadingPanel label="正在加载样本库..." />
        ) : (
          <>
            {/* iOS-style Segment Switcher */}
            <div className="flex border-b border-[var(--border-soft)]">
              {["AI快讯", "全球股市", "消费时尚"].map((dir) => {
                const isActive = selectedDirection === dir;
                const dirSamplesCount = groups.find((g) => g.direction === dir)?.samples.length || 0;
                return (
                  <button
                    key={dir}
                    onClick={() => setSelectedDirection(dir)}
                    className={`relative px-6 py-3 text-sm font-semibold transition-colors duration-150 ${
                      isActive
                        ? "text-[var(--text-1)] border-b-2 border-[var(--accent)]"
                        : "text-[var(--text-3)] hover:text-[var(--text-2)]"
                    }`}
                  >
                    {dir}
                    <span className="ml-2 rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-xs text-[var(--text-2)]">
                      {dirSamplesCount} 篇
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Flat high-density layout: Style Insight */}
            <PanelCard
              title="写作风格印记 (Style Insight)"
              description={`系统分析出的「${selectedDirection}」账号在长周期写作中呈现出的共性指纹。`}
            >
              {activeGroup.summary ? (
                <div className="grid gap-6 md:grid-cols-[1fr_2fr] md:divide-x md:divide-[var(--border-soft)]">
                  {/* Left Column: Stats */}
                  <div className="space-y-4 pr-0 md:pr-6">
                    <div>
                      <div className="text-xs uppercase tracking-[0.14em] text-[var(--text-3)]">平均长度</div>
                      <div className="mt-1 text-2xl font-bold text-[var(--text-1)]">
                        {activeGroup.summary.avgWordCount} 字
                      </div>
                      <div className="mt-0.5 text-xs text-[var(--text-2)]">
                        包含中文汉字及英文词汇
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-[0.14em] text-[var(--text-3)]">平均段落数</div>
                      <div className="mt-1 text-2xl font-bold text-[var(--text-1)]">
                        {activeGroup.summary.avgParagraphCount} 段
                      </div>
                      <div className="mt-0.5 text-xs text-[var(--text-2)]">
                        多段落结构能有效降低移动端排版阅读疲劳
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-[0.14em] text-[var(--text-3)]">语气关键词 (Tone)</div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {activeGroup.summary.toneKeywords.length > 0 ? (
                          activeGroup.summary.toneKeywords.map((k) => (
                            <Tag key={k} tone="success">
                              {k}
                            </Tag>
                          ))
                        ) : (
                          <span className="text-xs text-[var(--text-3)]">无特定高频语气词（建议丰富样本）</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Patterns */}
                  <div className="space-y-4 pl-0 md:pl-6">
                    <div>
                      <div className="text-sm font-semibold text-[var(--text-1)] mb-2 flex items-center gap-1.5">
                        <Info className="size-3.5 text-[var(--accent)]" />
                        常用开头套路
                      </div>
                      {activeGroup.summary.commonOpeningPatterns.length > 0 ? (
                        <ul className="space-y-2 text-sm leading-6 text-[var(--text-2)]">
                          {activeGroup.summary.commonOpeningPatterns.map((pattern, idx) => (
                            <li key={idx} className="flex gap-2 items-start">
                              <span className="text-[var(--accent)] font-mono">0{idx + 1}.</span>
                              <span className="truncate">{pattern}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-[var(--text-3)]">暂无样本开头模式分析</p>
                      )}
                    </div>

                    <div className="border-t border-[var(--border-soft)] pt-4">
                      <div className="text-sm font-semibold text-[var(--text-1)] mb-2 flex items-center gap-1.5">
                        <HelpCircle className="size-3.5 text-[var(--accent)]" />
                        标题倾向句式
                      </div>
                      {activeGroup.summary.titlePatterns.length > 0 ? (
                        <ul className="space-y-2 text-sm leading-6 text-[var(--text-2)]">
                          {activeGroup.summary.titlePatterns.map((title, idx) => (
                            <li key={idx} className="flex gap-2 items-start">
                              <span className="text-[var(--accent)] font-mono">#{idx + 1}</span>
                              <span className="truncate">{title}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-[var(--text-3)]">暂无样本标题模式分析</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-sm text-[var(--text-2)]">
                  当前方向尚无已生成风格特征。请在下方导入至少 2 篇样本文章来分析写作记忆。
                </div>
              )}
            </PanelCard>

            {/* Flat high-density List of Samples */}
            <PanelCard
              title="当前风格参考样本"
              description="点击样本行可展开查看文章原文细节，大模型将在起稿时使用这些文章作为少样本(Few-Shot)参考。"
            >
              {activeGroup.samples.length === 0 ? (
                <EmptyPanel
                  title="未配置风格样本"
                  description="当前方向下没有写入风格参考。您可以手动导入公众号文章、头条号爆款或自研的优质模版。"
                />
              ) : (
                <div className="overflow-hidden rounded-[var(--ios-radius-md)] border border-[var(--border-soft)] bg-[var(--surface-solid)]">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border-soft)] bg-[var(--surface-muted)] text-[var(--text-2)]">
                        <th className="px-4 py-3 font-semibold">文章标题</th>
                        <th className="px-4 py-3 font-semibold w-24">质量评分</th>
                        <th className="px-4 py-3 font-semibold w-48">标签</th>
                        <th className="px-4 py-3 font-semibold w-32">添加时间</th>
                        <th className="px-4 py-3 text-right font-semibold w-24">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-soft)] text-[var(--text-1)]">
                      {activeGroup.samples.map((sample) => (
                        <tr
                          key={sample.id}
                          onClick={() => setSelectedSampleForView(sample)}
                          className="group cursor-pointer transition hover:bg-[var(--surface-muted)]"
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex flex-col gap-1">
                              <span className="font-medium group-hover:text-[var(--accent)] transition-colors">
                                {sample.title}
                              </span>
                              {sample.source_url && (
                                <a
                                  href={sample.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 text-xs text-[var(--text-3)] hover:text-[var(--accent)]"
                                >
                                  <ExternalLink className="size-3" />
                                  外部来源链接
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                                (sample.quality_score ?? 0) >= 80
                                  ? "bg-[var(--sage-soft)] text-[var(--ok-text)]"
                                  : (sample.quality_score ?? 0) >= 60
                                  ? "bg-[var(--terracotta-soft)] text-[var(--warn-text)]"
                                  : "bg-[var(--danger-bg)] text-[var(--danger-text)]"
                              }`}
                            >
                              {sample.quality_score ?? "未评分"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex flex-wrap gap-1">
                              {sample.tags.length > 0 ? (
                                sample.tags.map((t) => (
                                  <Tag key={t} tone="default">
                                    {t}
                                  </Tag>
                                ))
                              ) : (
                                <span className="text-xs text-[var(--text-3)]">无</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-[var(--text-2)]">
                            {new Date(sample.created_at).toLocaleDateString("zh-CN", {
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            {deleteConfirmId === sample.id ? (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void handleDelete(sample.id);
                                  }}
                                  className="rounded-lg px-2 py-1 text-xs font-semibold text-[var(--danger-text)] bg-[var(--danger-bg)] hover:brightness-95 transition"
                                >
                                  确认
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirmId(null);
                                  }}
                                  className="rounded-lg px-2 py-1 text-xs text-[var(--text-2)] hover:bg-[var(--surface-muted)] transition"
                                >
                                  取消
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmId(sample.id);
                                }}
                                className="rounded-lg p-1.5 text-[var(--text-3)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger-text)] transition"
                                title="删除"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </PanelCard>
          </>
        )}
      </div>

      {/* Drawer overlay for Full Text viewing */}
      {selectedSampleForView && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs" onClick={() => setSelectedSampleForView(null)}>
          <div className="w-full max-w-2xl bg-[var(--surface-solid)] h-full shadow-xl flex flex-col animate-slide-in" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-6 py-4">
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-[var(--accent)]" />
                <span className="font-semibold text-[var(--text-1)]">样本详情</span>
              </div>
              <button
                onClick={() => setSelectedSampleForView(null)}
                className="rounded-full p-1.5 hover:bg-[var(--surface-muted)] text-[var(--text-2)]"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Details Panel */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <div>
                <h1 className="text-xl font-bold text-[var(--text-1)]">{selectedSampleForView.title}</h1>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-[var(--text-2)] font-medium">
                    {selectedSampleForView.account_direction}
                  </span>
                  {selectedSampleForView.quality_score && (
                    <span className="rounded-full bg-[var(--sage-soft)] px-2.5 py-1 text-[var(--ok-text)] font-semibold">
                      质量分 {selectedSampleForView.quality_score}
                    </span>
                  )}
                  {selectedSampleForView.tags.map((t) => (
                    <span key={t} className="rounded-full border border-[var(--border-soft)] px-2.5 py-1 text-[var(--text-2)]">
                      {t}
                    </span>
                  ))}
                </div>
                {selectedSampleForView.source_url && (
                  <div className="mt-2">
                    <a
                      href={selectedSampleForView.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[var(--accent)] hover:underline inline-flex items-center gap-1"
                    >
                      <ExternalLink className="size-3.5" />
                      点击访问原始网页: {selectedSampleForView.source_url}
                    </a>
                  </div>
                )}
              </div>

              <div className="border-t border-[var(--border-soft)] pt-5">
                <div className="text-xs uppercase tracking-[0.14em] text-[var(--text-3)] mb-3">文章正文</div>
                <div className="text-sm leading-7 text-[var(--text-1)] whitespace-pre-wrap font-sans">
                  {selectedSampleForView.content}
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="border-t border-[var(--border-soft)] px-6 py-4 flex justify-between bg-[var(--surface-muted)]">
              <Button
                variant="secondary"
                onClick={() => {
                  navigator.clipboard.writeText(selectedSampleForView.content);
                  showToast("正文已复制到剪切板");
                }}
              >
                复制正文
              </Button>
              <Button
                variant="ghost"
                className="text-[var(--danger-text)] hover:bg-[var(--danger-bg)]"
                onClick={() => {
                  const id = selectedSampleForView.id;
                  setSelectedSampleForView(null);
                  setDeleteConfirmId(id);
                }}
              >
                删除样本
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer overlay for Importing Sample */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs" onClick={() => setIsImportOpen(false)}>
          <form
            onSubmit={handleImportSubmit}
            className="w-full max-w-xl bg-[var(--surface-solid)] h-full shadow-xl flex flex-col animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-6 py-4">
              <div className="flex items-center gap-2">
                <Plus className="size-5 text-[var(--accent)]" />
                <span className="font-semibold text-[var(--text-1)]">导入风格样本</span>
              </div>
              <button
                type="button"
                onClick={() => setIsImportOpen(false)}
                className="rounded-full p-1.5 hover:bg-[var(--surface-muted)] text-[var(--text-2)]"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Scrollable form body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {formError && (
                <div className="rounded-lg bg-[var(--danger-bg)] p-3 text-xs text-[var(--danger-text)] border border-[color:color-mix(in_srgb,var(--danger-text)_24%,transparent)]">
                  {formError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-2)]">发布账号 / 写作方向</label>
                <select
                  value={formDirection}
                  onChange={(e) => setFormDirection(e.target.value)}
                  className="w-full h-10 px-3 rounded-[var(--ios-radius-sm)] border border-[var(--border)] bg-[var(--surface-solid)] text-sm text-[var(--text-1)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                >
                  <option value="AI快讯">AI快讯</option>
                  <option value="全球股市">全球股市</option>
                  <option value="消费时尚">消费时尚</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-2)]">样本文章标题</label>
                <input
                  type="text"
                  placeholder="例如: OpenAI 发布 GPT-6：多模态推理能力提升 3 倍"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-[var(--ios-radius-sm)] border border-[var(--border)] bg-[var(--surface-solid)] text-sm text-[var(--text-1)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-2)]">来源链接 (Source URL) - 可选</label>
                <input
                  type="url"
                  placeholder="例如: https://mp.weixin.qq.com/s/..."
                  value={formSourceUrl}
                  onChange={(e) => setFormSourceUrl(e.target.value)}
                  className="w-full h-10 px-3 rounded-[var(--ios-radius-sm)] border border-[var(--border)] bg-[var(--surface-solid)] text-sm text-[var(--text-1)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-2)]">标签 - 英文/中文逗号分隔</label>
                <input
                  type="text"
                  placeholder="例如: 大模型, GPT-6, 资讯 (可选)"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="w-full h-10 px-3 rounded-[var(--ios-radius-sm)] border border-[var(--border)] bg-[var(--surface-solid)] text-sm text-[var(--text-1)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label className="text-xs font-semibold text-[var(--text-2)]">基准质量评分 (1-100)</label>
                  <span className="text-xs font-bold text-[var(--accent)]">{formQualityScore} 分</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={formQualityScore}
                  onChange={(e) => setFormQualityScore(Number(e.target.value))}
                  className="w-full h-2 rounded-lg bg-[var(--surface-muted)] appearance-none cursor-pointer accent-[var(--accent)]"
                />
              </div>

              <div className="space-y-1.5 flex-1 flex flex-col">
                <label className="text-xs font-semibold text-[var(--text-2)]">文章正文内容 (字数不低于10字)</label>
                <textarea
                  placeholder="此处粘贴文章全文内容。系统将在此文本基础上提炼出平均段落长短、句式特点等印记特征。"
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full flex-1 min-h-[220px] p-3 rounded-[var(--ios-radius-sm)] border border-[var(--border)] bg-[var(--surface-solid)] text-sm text-[var(--text-1)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] font-sans"
                  required
                />
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-[var(--border-soft)] px-6 py-4 flex justify-end gap-3 bg-[var(--surface-muted)]">
              <Button type="button" variant="secondary" onClick={() => setIsImportOpen(false)} disabled={submitting}>
                取消
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? "正在导入..." : "确认导入"}
              </Button>
            </div>
          </form>
        </div>
      )}
      {/* Floating toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] animate-scale-in">
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-solid)] px-4 py-2.5 shadow-lg text-sm text-[var(--text-1)]">
            <Check className="size-4 text-[var(--ok-text)]" />
            {toastMessage}
          </div>
        </div>
      )}

      {/* Standalone delete confirmation overlay (triggered from drawer) */}
      {deleteConfirmId && !selectedSampleForView && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-xs"
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            className="w-full max-w-sm bg-[var(--surface-solid)] rounded-[var(--ios-radius-lg)] shadow-2xl p-6 animate-scale-in border border-[var(--border-soft)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--danger-bg)]">
                <AlertTriangle className="size-5 text-[var(--danger-text)]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-1)]">确认删除样本</h3>
                <p className="mt-1 text-xs text-[var(--text-2)] leading-5">
                  删除后无法恢复，对应写作风格分析将重新计算。
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>
                取消
              </Button>
              <Button
                variant="primary"
                className="bg-[var(--danger-text)] hover:brightness-90"
                onClick={() => void handleDelete(deleteConfirmId)}
              >
                确认删除
              </Button>
            </div>
          </div>
        </div>
      )}
    </WorkspaceLayout>
  );
}
