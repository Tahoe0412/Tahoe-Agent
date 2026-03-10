"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PanelCard } from "@/components/ui/panel-card";
import { Disclosure } from "@/components/ui/disclosure";
import { getPlatformSurfaceMeta, type PlatformSurface } from "@/lib/platform-surface";

type IndustryTemplateRow = {
  id: string;
  industry_name: string;
  industry_keywords: string[];
  competitor_keywords: string[];
  forbidden_terms: string[];
  recommended_topic_directions: string[];
  competitor_profiles: Array<{
    id: string;
    competitor_name: string;
    competitor_tier: string;
    primary_platforms: string[];
  }>;
  projects: Array<{ id: string; title: string; status: string }>;
};

const surfaces: PlatformSurface[] = ["XIAOHONGSHU_POST", "XIAOHONGSHU_VIDEO", "DOUYIN_VIDEO", "DOUYIN_TITLE", "COMMENT_REPLY", "COVER_COPY"];

const competitorTiers = ["DIRECT", "ASPIRATIONAL", "CATEGORY_LEADER"] as const;

function getCompetitorTierLabel(tier: string) {
  const labels: Record<string, string> = {
    DIRECT: "直接竞品",
    ASPIRATIONAL: "参考竞品",
    CATEGORY_LEADER: "类目头部",
  };
  return labels[tier] ?? tier;
}

export function IndustryTemplateWorkbench({
  templates,
  projectId,
  activeIndustryTemplateId,
}: {
  templates: IndustryTemplateRow[];
  projectId?: string;
  activeIndustryTemplateId?: string | null;
}) {
  const router = useRouter();
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id ?? "");
  const [industryName, setIndustryName] = useState("");
  const [industryKeywords, setIndustryKeywords] = useState("");
  const [painPoints, setPainPoints] = useState("");
  const [topics, setTopics] = useState("");
  const [platformPriority, setPlatformPriority] = useState<string[]>(["XIAOHONGSHU_POST", "DOUYIN_VIDEO"]);
  const [forbiddenTerms, setForbiddenTerms] = useState("");
  const [competitorName, setCompetitorName] = useState("");
  const [competitorTier, setCompetitorTier] = useState<(typeof competitorTiers)[number]>("DIRECT");
  const [competitorPlatforms, setCompetitorPlatforms] = useState<string[]>(["DOUYIN_VIDEO"]);
  const [competitorAngles, setCompetitorAngles] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"template" | "competitor" | "attach" | null>(null);

  const activeTemplate = templates.find((item) => item.id === selectedTemplateId) ?? templates[0] ?? null;

  function toggle(items: string[], value: string, setter: (items: string[]) => void) {
    setter(items.includes(value) ? items.filter((item) => item !== value) : [...items, value]);
  }

  async function createTemplate() {
    setPending("template");
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/industry-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry_name: industryName,
          industry_keywords: industryKeywords.split("\n").map((item) => item.trim()).filter(Boolean),
          competitor_keywords: [],
          forbidden_terms: forbiddenTerms.split("\n").map((item) => item.trim()).filter(Boolean),
          platform_content_priorities: platformPriority,
          common_pain_points: painPoints.split("\n").map((item) => item.trim()).filter(Boolean),
          common_questions: [],
          recommended_content_pillars: [],
          recommended_topic_directions: topics.split("\n").map((item) => item.trim()).filter(Boolean),
        }),
      });
      const payload = (await response.json()) as { success: boolean; error?: { message?: string; detail?: string } };
      if (!payload.success) throw new Error(payload.error?.detail || payload.error?.message || "创建行业模板失败。");
      setMessage("行业模板已创建。");
      setIndustryName("");
      setIndustryKeywords("");
      setPainPoints("");
      setTopics("");
      setForbiddenTerms("");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "创建行业模板失败。");
    } finally {
      setPending(null);
    }
  }

  async function createCompetitor() {
    if (!activeTemplate) return;
    setPending("competitor");
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(`/api/industry-templates/${activeTemplate.id}/competitors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitor_name: competitorName,
          competitor_tier: competitorTier,
          keywords: [],
          primary_platforms: competitorPlatforms,
          messaging_angles: competitorAngles.split("\n").map((item) => item.trim()).filter(Boolean),
        }),
      });
      const payload = (await response.json()) as { success: boolean; error?: { message?: string; detail?: string } };
      if (!payload.success) throw new Error(payload.error?.detail || payload.error?.message || "创建竞品失败。");
      setMessage("竞品档案已创建。");
      setCompetitorName("");
      setCompetitorAngles("");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "创建竞品失败。");
    } finally {
      setPending(null);
    }
  }

  async function attachToProject(templateId: string) {
    if (!projectId) return;
    setPending("attach");
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry_template_id: templateId }),
      });
      const payload = (await response.json()) as { success: boolean; error?: { message?: string; detail?: string } };
      if (!payload.success) throw new Error(payload.error?.detail || payload.error?.message || "绑定行业模板失败。");
      setMessage("行业模板已绑定到当前项目。");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "绑定行业模板失败。");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <PanelCard title="行业模板库" description="把行业关键词、竞品研究、内容边界、风险词和推荐选题方向做成平台可复用模板。">
        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-3">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => setSelectedTemplateId(template.id)}
                className={`w-full rounded-[22px] border p-4 text-left transition ${
                  template.id === activeTemplate?.id ? "theme-panel-strong border-transparent" : "border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface-solid)]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold">{template.industry_name}</div>
                    <div className={`mt-1 text-xs ${template.id === activeTemplate?.id ? "text-[color:rgba(246,240,232,0.72)]" : "text-[var(--text-2)]"}`}>{template.competitor_profiles.length} 个竞品 · {template.projects.length} 个项目</div>
                  </div>
                  {projectId && activeIndustryTemplateId === template.id ? <span className="theme-chip-ok rounded-full px-2.5 py-1 text-xs font-medium">当前项目</span> : null}
                </div>
                <div className={`mt-3 line-clamp-3 text-sm leading-6 ${template.id === activeTemplate?.id ? "text-[color:rgba(246,240,232,0.84)]" : "text-[var(--text-2)]"}`}>{template.recommended_topic_directions.slice(0, 2).join(" · ") || "等待补充推荐选题方向。"}</div>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="theme-panel-muted rounded-[22px] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">先填最关键的行业信息</div>
              <div className="mt-4 grid gap-4">
                <input value={industryName} onChange={(event) => setIndustryName(event.target.value)} className="theme-input rounded-[16px] px-4 py-3 text-sm" placeholder="行业名称，例如口腔连锁 / 新消费护肤 / 本地餐饮" />
                <textarea value={industryKeywords} onChange={(event) => setIndustryKeywords(event.target.value)} rows={4} className="theme-input rounded-[18px] px-4 py-3 text-sm leading-7" placeholder="行业关键词，每行一条" />
                <textarea value={painPoints} onChange={(event) => setPainPoints(event.target.value)} rows={4} className="theme-input rounded-[18px] px-4 py-3 text-sm leading-7" placeholder="用户常见痛点，每行一条" />
                <textarea value={topics} onChange={(event) => setTopics(event.target.value)} rows={4} className="theme-input rounded-[18px] px-4 py-3 text-sm leading-7" placeholder="推荐选题方向，每行一条" />
                <div className="space-y-2">
                  <div className="text-xs font-medium text-[var(--text-3)]">优先平台（可多选）</div>
                  <div className="flex flex-wrap gap-2">
                    {surfaces.map((surface) => (
                      <button key={surface} type="button" onClick={() => toggle(platformPriority, surface, setPlatformPriority)} className={`rounded-full border px-3 py-1.5 text-xs transition ${platformPriority.includes(surface) ? "border-[var(--surface-strong)] bg-[var(--surface-strong)] text-[var(--text-inverse)]" : "border-[var(--border)] bg-[var(--surface-solid)] text-[var(--text-2)]"}`}>
                        {getPlatformSurfaceMeta(surface).label}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea value={forbiddenTerms} onChange={(event) => setForbiddenTerms(event.target.value)} rows={3} className="theme-input rounded-[18px] px-4 py-3 text-sm leading-7" placeholder="风险词（可选），每行一条" />
                <div className="flex items-center gap-3">
                  <Button onClick={() => void createTemplate()} disabled={pending !== null}>{pending === "template" ? "创建中..." : "创建行业模板"}</Button>
                  {message ? <div className="text-sm text-[var(--ok-text)]">{message}</div> : null}
                  {error ? <div className="text-sm text-[var(--danger-text)]">{error}</div> : null}
                </div>
              </div>
            </div>

            {activeTemplate ? (
              <div className="theme-panel-muted rounded-[22px] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[var(--text-1)]">{activeTemplate.industry_name}</div>
                    <div className="mt-1 text-sm text-[var(--text-2)]">{activeTemplate.competitor_profiles.length} 个竞品 · {activeTemplate.forbidden_terms.length} 个风险词 · {activeTemplate.projects.length} 个关联项目</div>
                  </div>
                  {projectId ? <Button variant="secondary" onClick={() => void attachToProject(activeTemplate.id)} disabled={pending !== null}>绑定到当前项目</Button> : null}
                </div>
                <Disclosure className="mt-4 rounded-[18px] border border-[var(--border)] bg-[var(--surface-solid)] p-4" summary="继续补充竞品（可选）" defaultOpen={false}>
                  <div className="grid gap-3 pt-3">
                    <input value={competitorName} onChange={(event) => setCompetitorName(event.target.value)} className="theme-input rounded-[16px] px-4 py-3 text-sm" placeholder="竞品名" />
                    <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
                      <select value={competitorTier} onChange={(event) => setCompetitorTier(event.target.value as (typeof competitorTiers)[number])} className="theme-input rounded-[16px] px-4 py-3 text-sm">
                        {competitorTiers.map((item) => (
                          <option key={item} value={item}>
                            {getCompetitorTierLabel(item)}
                          </option>
                        ))}
                      </select>
                      <textarea value={competitorAngles} onChange={(event) => setCompetitorAngles(event.target.value)} rows={2} className="theme-input rounded-[18px] px-4 py-3 text-sm leading-7" placeholder="竞品常用内容角度，每行一条" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {surfaces.map((surface) => (
                        <button key={surface} type="button" onClick={() => toggle(competitorPlatforms, surface, setCompetitorPlatforms)} className={`rounded-full border px-3 py-1.5 text-xs transition ${competitorPlatforms.includes(surface) ? "border-[var(--surface-strong)] bg-[var(--surface-strong)] text-[var(--text-inverse)]" : "border-[var(--border)] bg-[var(--surface-solid)] text-[var(--text-2)]"}`}>
                          {getPlatformSurfaceMeta(surface).label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="secondary" onClick={() => void createCompetitor()} disabled={pending !== null}>{pending === "competitor" ? "保存中..." : "新增竞品档案"}</Button>
                    </div>
                  </div>
                </Disclosure>
              </div>
            ) : null}
          </div>
        </div>
      </PanelCard>

      <PanelCard title="行业研究视图" description="先看这个行业的关键词、推荐方向和风险词。竞品只保留最关键的参考信息。">
        {activeTemplate ? (
          <div className="space-y-5">
            <div className="text-2xl font-semibold tracking-tight text-[var(--text-1)]">{activeTemplate.industry_name}</div>
            <div className="flex flex-wrap gap-2">
              {activeTemplate.industry_keywords.slice(0, 8).map((item) => (
                <span key={item} className="theme-pill rounded-full px-2.5 py-1 text-xs font-medium">{item}</span>
              ))}
            </div>
            <div className="theme-panel-muted rounded-[20px] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">推荐选题方向</div>
              <div className="mt-3 space-y-2 text-sm leading-7 text-[var(--text-2)]">
                {activeTemplate.recommended_topic_directions.length ? activeTemplate.recommended_topic_directions.map((item) => <div key={item}>• {item}</div>) : <div>当前未配置。</div>}
              </div>
            </div>
            <div className="theme-panel-muted rounded-[20px] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">风险词</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {activeTemplate.forbidden_terms.length ? activeTemplate.forbidden_terms.map((item) => <span key={item} className="theme-chip-danger rounded-full px-2.5 py-1 text-xs font-medium">{item}</span>) : <span className="text-sm text-[var(--text-2)]">当前未配置。</span>}
              </div>
            </div>
            <div className="space-y-3">
              {activeTemplate.competitor_profiles.map((competitor) => (
                <div key={competitor.id} className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[var(--text-1)]">{competitor.competitor_name}</div>
                    <span className="theme-pill rounded-full px-2.5 py-1 text-xs font-medium">{getCompetitorTierLabel(competitor.competitor_tier)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {competitor.primary_platforms.map((item) => (
                      <span key={item} className="theme-chip rounded-full px-2.5 py-1 text-xs font-medium">{getPlatformSurfaceMeta(item as PlatformSurface).label}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-[22px] border border-dashed border-[var(--border)] bg-[var(--surface-muted)] p-5 text-sm leading-7 text-[var(--text-2)]">
            先创建一个行业模板，再把它绑定到项目。之后趋势研究、内容方向和合规边界都可以复用这套行业配置。
          </div>
        )}
      </PanelCard>
    </div>
  );
}
