"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ProjectModePicker } from "@/components/dashboard/project-mode-picker";
import { copyLengthList, getCopyLengthMeta, getUsageScenarioMeta, type CopyLength, type UsageScenario, usageScenarioList } from "@/lib/copy-goal";
import { getStyleTemplateMeta, type StyleTemplate, styleTemplateList } from "@/lib/style-template";
import { getWritingModeMeta, type WritingMode, writingModeList } from "@/lib/writing-mode";
import { getWorkspaceModeMeta, type WorkspaceMode } from "@/lib/workspace-mode";
import { cn } from "@/lib/utils";

export function ProjectForm() {
  const router = useRouter();
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("SHORT_VIDEO");
  const [writingMode, setWritingMode] = useState<WritingMode>("PRODUCT_PROMO");
  const [styleTemplate, setStyleTemplate] = useState<StyleTemplate>("RATIONAL_PRO");
  const [copyLength, setCopyLength] = useState<CopyLength>("STANDARD");
  const [usageScenario, setUsageScenario] = useState<UsageScenario>("XIAOHONGSHU_POST");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const modeMeta = useMemo(() => getWorkspaceModeMeta(workspaceMode, "zh"), [workspaceMode]);
  const writingMeta = useMemo(() => getWritingModeMeta(writingMode, "zh"), [writingMode]);
  const styleMeta = useMemo(() => getStyleTemplateMeta(styleTemplate, "zh"), [styleTemplate]);
  const copyLengthMeta = useMemo(() => getCopyLengthMeta(copyLength, "zh"), [copyLength]);
  const usageScenarioMeta = useMemo(() => getUsageScenarioMeta(usageScenario, "zh"), [usageScenario]);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setMessage(null);

    const payload = {
      title: String(formData.get("title") || ""),
      topic: String(formData.get("topic") || ""),
      sourceScript: String(formData.get("sourceScript") || ""),
      projectIntroduction: String(formData.get("projectIntroduction") || ""),
      coreIdea: String(formData.get("coreIdea") || ""),
      styleReferenceSample: String(formData.get("styleReferenceSample") || ""),
      writingMode,
      styleTemplate,
      copyLength,
      usageScenario,
      platforms: modeMeta.platforms,
      workspaceMode,
    };

    const response = await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = (await response.json()) as { success: boolean; data?: { project: { id: string } }; error?: { message: string } };

    if (result.success && result.data) {
      setMessage(`已创建项目 ${result.data.project.id}，可继续接入真实平台采集与模型编排。`);
      router.push(`/?projectId=${result.data.project.id}`);
    } else {
      setMessage(result.error?.message || "请求失败");
    }

    setSubmitting(false);
  }

  return (
    <form action={handleSubmit} className="theme-panel space-y-6 rounded-[28px] p-6">
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-3)]">开始新项目</div>
        <div className="text-2xl font-semibold tracking-tight text-[var(--text-1)]">先选择你要完成的工作</div>
        <div className="max-w-3xl text-sm leading-7 text-[var(--text-2)]">
          不同模式会自动收缩导航、默认平台和推荐流程，避免用户一上来就看到全部复杂能力。
        </div>
      </div>

      <ProjectModePicker value={workspaceMode} locale="zh" onChange={setWorkspaceMode} />

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="theme-panel-muted rounded-[24px] p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-3)]">模式说明</div>
          <div className="mt-3 text-2xl font-semibold text-[var(--text-1)]">{modeMeta.label}</div>
          <div className="mt-3 text-sm leading-7 text-[var(--text-2)]">{modeMeta.description}</div>
          <div className="mt-5 flex flex-wrap gap-2">
            {modeMeta.platforms.map((platform) => (
              <span key={platform} className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-2)]">
                {platform}
              </span>
            ))}
          </div>
          <div className="mt-5 space-y-3">
            {[
              workspaceMode === "SHORT_VIDEO" ? "趋势研究 -> 脚本重构 -> 分镜与素材" : null,
              workspaceMode === "COPYWRITING" ? "任务单 -> 改写 -> 平台适配 -> 合规" : null,
              workspaceMode === "PROMOTION" ? "任务单 -> 推广表达 -> 合规 -> 复盘优化" : null,
            ]
              .filter(Boolean)
              .map((line) => (
                <div key={line} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-3 text-sm text-[var(--text-2)]">
                  {line}
                </div>
              ))}
          </div>
          {(workspaceMode === "COPYWRITING" || workspaceMode === "PROMOTION") ? (
            <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-3 text-sm text-[var(--text-2)]">
              当前写作模式：<span className="font-medium text-[var(--text-1)]">{writingMeta.label}</span>
            </div>
          ) : null}
          {(workspaceMode === "COPYWRITING" || workspaceMode === "PROMOTION") ? (
            <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-3 text-sm text-[var(--text-2)]">
              当前输出风格：<span className="font-medium text-[var(--text-1)]">{styleMeta.label}</span>
            </div>
          ) : null}
          {(workspaceMode === "COPYWRITING" || workspaceMode === "PROMOTION") ? (
            <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-3 text-sm text-[var(--text-2)]">
              文案长度：<span className="font-medium text-[var(--text-1)]">{copyLengthMeta.label}</span>
            </div>
          ) : null}
          {(workspaceMode === "COPYWRITING" || workspaceMode === "PROMOTION") ? (
            <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-3 text-sm text-[var(--text-2)]">
              使用场景：<span className="font-medium text-[var(--text-1)]">{usageScenarioMeta.label}</span>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          {(workspaceMode === "COPYWRITING" || workspaceMode === "PROMOTION") ? (
            <div className="space-y-2">
              <span className="text-sm font-medium text-[var(--text-2)]">写作模式</span>
              <div className="grid gap-3 md:grid-cols-2">
                {writingModeList.map((mode) => {
                  const meta = getWritingModeMeta(mode, "zh");
                  const active = writingMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setWritingMode(mode)}
                      className={cn(
                        "rounded-[20px] border p-4 text-left transition",
                        active
                          ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[0_0_0_1px_var(--accent)]"
                          : "border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface-solid)]",
                      )}
                    >
                      <div className="text-sm font-semibold text-[var(--text-1)]">{meta.label}</div>
                      <div className="mt-2 text-sm leading-6 text-[var(--text-2)]">{meta.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {(workspaceMode === "COPYWRITING" || workspaceMode === "PROMOTION") ? (
            <div className="space-y-2">
              <span className="text-sm font-medium text-[var(--text-2)]">输出风格</span>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {styleTemplateList.map((style) => {
                  const meta = getStyleTemplateMeta(style, "zh");
                  const active = styleTemplate === style;
                  return (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setStyleTemplate(style)}
                      className={cn(
                        "rounded-[20px] border p-4 text-left transition",
                        active
                          ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[0_0_0_1px_var(--accent)]"
                          : "border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface-solid)]",
                      )}
                    >
                      <div className="text-sm font-semibold text-[var(--text-1)]">{meta.label}</div>
                      <div className="mt-2 text-sm leading-6 text-[var(--text-2)]">{meta.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {(workspaceMode === "COPYWRITING" || workspaceMode === "PROMOTION") ? (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--text-2)]">文案长度</span>
                <select value={copyLength} onChange={(event) => setCopyLength(event.target.value as CopyLength)} className="theme-input w-full rounded-2xl px-4 py-3 text-sm">
                  {copyLengthList.map((item) => (
                    <option key={item} value={item}>
                      {getCopyLengthMeta(item, "zh").label}
                    </option>
                  ))}
                </select>
                <div className="text-sm text-[var(--text-2)]">{copyLengthMeta.description}</div>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--text-2)]">使用场景</span>
                <select value={usageScenario} onChange={(event) => setUsageScenario(event.target.value as UsageScenario)} className="theme-input w-full rounded-2xl px-4 py-3 text-sm">
                  {usageScenarioList.map((item) => (
                    <option key={item} value={item}>
                      {getUsageScenarioMeta(item, "zh").label}
                    </option>
                  ))}
                </select>
                <div className="text-sm text-[var(--text-2)]">{usageScenarioMeta.description}</div>
              </label>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--text-2)]">项目名称</span>
              <input
                name="title"
                key={`${workspaceMode}-title`}
                defaultValue={modeMeta.titleDefault}
                className="theme-input w-full rounded-2xl px-4 py-3 text-sm"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--text-2)]">选题主题</span>
              <input
                name="topic"
                key={`${workspaceMode}-topic`}
                defaultValue={modeMeta.topicDefault}
                className="theme-input w-full rounded-2xl px-4 py-3 text-sm"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--text-2)]">项目介绍</span>
              <textarea
                name="projectIntroduction"
                rows={4}
                placeholder="这个项目是做什么的、面向谁、当前阶段是什么。"
                className="theme-input w-full rounded-3xl px-4 py-3 text-sm leading-7"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--text-2)]">核心想法</span>
              <textarea
                name="coreIdea"
                rows={4}
                placeholder="一句话写清这轮真正想打动用户的核心表达。"
                className="theme-input w-full rounded-3xl px-4 py-3 text-sm leading-7"
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--text-2)]">
              {workspaceMode === "SHORT_VIDEO" ? "原始脚本 / 核心想法" : workspaceMode === "COPYWRITING" ? "文案需求 / 核心表达" : "推广需求 / 宣传目标"}
            </span>
            <textarea
              name="sourceScript"
              rows={8}
              key={`${workspaceMode}-script`}
              defaultValue={modeMeta.sourceScriptDefault}
              className="theme-input w-full rounded-3xl px-4 py-3 text-sm leading-7"
            />
          </label>

          {(workspaceMode === "COPYWRITING" || workspaceMode === "PROMOTION") ? (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--text-2)]">风格参照 / 参考样稿</span>
              <textarea
                name="styleReferenceSample"
                rows={6}
                placeholder="可粘贴 1-3 段你喜欢的文案。模型会学习语气、节奏、句长和结构，不会直接照抄内容。"
                className="theme-input w-full rounded-3xl px-4 py-3 text-sm leading-7"
              />
              <div className="text-sm text-[var(--text-2)]">建议贴多段完整样稿，比只写几个关键词更能稳定控制文风。</div>
            </label>
          ) : null}

          <div className="flex flex-wrap gap-2 text-xs text-[var(--text-3)]">
            <span className="rounded-full border border-[var(--border)] px-3 py-1.5">默认平台：{modeMeta.platforms.join(" / ")}</span>
            <span className={cn("rounded-full border px-3 py-1.5", workspaceMode === "SHORT_VIDEO" ? "theme-chip-ok" : "border-[var(--border)]")}>
              当前模式：{modeMeta.label}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting ? "创建中..." : "创建项目"}
            </Button>
            {message ? <p className="text-sm text-[var(--text-2)]">{message}</p> : null}
          </div>
        </div>
      </div>
    </form>
  );
}
