"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PanelCard } from "@/components/ui/panel-card";
import { Disclosure } from "@/components/ui/disclosure";
import { TagInput } from "@/components/ui/tag-input";
import { getPlatformSurfaceMeta, type PlatformSurface } from "@/lib/platform-surface";

type BrandProfileRow = {
  id: string;
  brand_name: string;
  brand_positioning: string;
  brand_stage: "COLD_START" | "VALIDATION" | "SCALE";
  brand_voice: string | null;
  platform_priority: string[];
  forbidden_phrases: string[];
  keyword_pool: string[];
  content_pillars: Array<{
    id: string;
    pillar_name: string;
    pillar_type: string;
    priority_score: number;
  }>;
  projects: Array<{ id: string; title: string; status: string }>;
};

const stages = [
  { value: "COLD_START", label: "冷启动" },
  { value: "VALIDATION", label: "验证期" },
  { value: "SCALE", label: "放量期" },
] as const;

const surfaces: PlatformSurface[] = ["XIAOHONGSHU_POST", "XIAOHONGSHU_VIDEO", "DOUYIN_VIDEO", "DOUYIN_TITLE", "COMMENT_REPLY", "COVER_COPY"];

const pillarTypes = [
  "EDUCATION",
  "BRAND_STORY",
  "PRODUCT_VALUE",
  "USE_CASE",
  "TRUST_SIGNAL",
  "FOUNDER_IP",
  "USER_TESTIMONIAL",
  "TREND_REACTION",
] as const;

function getStageLabel(stage: BrandProfileRow["brand_stage"]) {
  return stages.find((item) => item.value === stage)?.label ?? stage;
}

function getPillarTypeLabel(type: string) {
  const labels: Record<string, string> = {
    EDUCATION: "科普教育型",
    BRAND_STORY: "品牌故事型",
    PRODUCT_VALUE: "产品价值型",
    USE_CASE: "使用场景型",
    TRUST_SIGNAL: "信任建立型",
    FOUNDER_IP: "创始人 / IP 型",
    USER_TESTIMONIAL: "用户见证型",
    TREND_REACTION: "热点借势型",
  };
  return labels[type] ?? type;
}

export function BrandProfileWorkbench({
  profiles,
  projectId,
  activeBrandProfileId,
}: {
  profiles: BrandProfileRow[];
  projectId?: string;
  activeBrandProfileId?: string | null;
}) {
  const router = useRouter();
  const [brandName, setBrandName] = useState("");
  const [positioning, setPositioning] = useState("");
  const [voice, setVoice] = useState("");
  const [stage, setStage] = useState<(typeof stages)[number]["value"]>("COLD_START");
  const [platformPriority, setPlatformPriority] = useState<string[]>(["XIAOHONGSHU_POST", "DOUYIN_VIDEO"]);
  const [forbidden, setForbidden] = useState<string[]>([]);
  const [keywordPool, setKeywordPool] = useState<string[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState(profiles[0]?.id ?? "");
  const [pillarName, setPillarName] = useState("");
  const [pillarType, setPillarType] = useState<(typeof pillarTypes)[number]>("EDUCATION");
  const [pillarSummary, setPillarSummary] = useState("");
  const [pillarTopics, setPillarTopics] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"brand" | "pillar" | "attach" | null>(null);

  const activeProfile = profiles.find((item) => item.id === selectedProfileId) ?? profiles[0] ?? null;

  function toggleSurface(surface: PlatformSurface) {
    setPlatformPriority((current) => (current.includes(surface) ? current.filter((item) => item !== surface) : [...current, surface]));
  }

  async function createProfile() {
    setPending("brand");
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/brand-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_name: brandName,
          brand_positioning: positioning,
          brand_voice: voice || undefined,
          brand_stage: stage,
          product_lines: [],
          target_personas: [],
          platform_priority: platformPriority,
          forbidden_phrases: forbidden,
          keyword_pool: keywordPool,
        }),
      });
      const payload = (await response.json()) as { success: boolean; error?: { message?: string; detail?: string } };
      if (!payload.success) throw new Error(payload.error?.detail || payload.error?.message || "创建品牌档案失败。");
      setMessage("品牌档案已创建。");
      setBrandName("");
      setPositioning("");
      setVoice("");
      setForbidden([]);
      setKeywordPool([]);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "创建品牌档案失败。");
    } finally {
      setPending(null);
    }
  }

  async function createPillar() {
    if (!activeProfile) return;
    setPending("pillar");
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(`/api/brand-profiles/${activeProfile.id}/content-pillars`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pillar_name: pillarName,
          pillar_type: pillarType,
          pillar_summary: pillarSummary || undefined,
          topic_directions: pillarTopics,
          platform_fit: activeProfile.platform_priority,
          priority_score: 70,
          active: true,
        }),
      });
      const payload = (await response.json()) as { success: boolean; error?: { message?: string; detail?: string } };
      if (!payload.success) throw new Error(payload.error?.detail || payload.error?.message || "创建内容支柱失败。");
      setMessage("内容支柱已创建。");
      setPillarName("");
      setPillarSummary("");
      setPillarTopics([]);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "创建内容支柱失败。");
    } finally {
      setPending(null);
    }
  }

  async function attachToProject(profileId: string) {
    if (!projectId) return;
    setPending("attach");
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_profile_id: profileId }),
      });
      const payload = (await response.json()) as { success: boolean; error?: { message?: string; detail?: string } };
      if (!payload.success) throw new Error(payload.error?.detail || payload.error?.message || "绑定项目失败。");
      setMessage("品牌档案已绑定到当前项目。");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "绑定项目失败。");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <PanelCard title="品牌档案库" description="平台级沉淀品牌定位、品牌语气、禁用表达与内容支柱，供多个项目快速复用。">
        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-3">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                type="button"
                onClick={() => setSelectedProfileId(profile.id)}
                className={`w-full rounded-[22px] border p-4 text-left transition ${
                  profile.id === activeProfile?.id ? "theme-panel-strong border-transparent" : "border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface-solid)]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold">{profile.brand_name}</div>
                    <div className={`mt-1 text-xs ${profile.id === activeProfile?.id ? "text-white/72" : "text-[var(--text-2)]"}`}>{getStageLabel(profile.brand_stage)}</div>
                  </div>
                  {projectId && activeBrandProfileId === profile.id ? <span className="theme-chip-ok rounded-full px-2.5 py-1 text-xs font-medium">当前项目</span> : null}
                </div>
                <div className={`mt-3 line-clamp-3 text-sm leading-6 ${profile.id === activeProfile?.id ? "text-white/84" : "text-[var(--text-2)]"}`}>{profile.brand_positioning}</div>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="theme-panel-muted rounded-[22px] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">先填最关键的品牌信息</div>
              <div className="mt-4 grid gap-4">
                <input value={brandName} onChange={(event) => setBrandName(event.target.value)} className="theme-input rounded-[16px] px-4 py-3 text-sm" placeholder="品牌名" />
                <textarea value={positioning} onChange={(event) => setPositioning(event.target.value)} rows={4} className="theme-input rounded-[18px] px-4 py-3 text-sm leading-7" placeholder="一句话写清品牌是谁、想占据什么认知位置" />
                <div className="grid gap-4 md:grid-cols-2">
                  <input value={voice} onChange={(event) => setVoice(event.target.value)} className="theme-input rounded-[16px] px-4 py-3 text-sm" placeholder="品牌语气（可选），例如克制、可信、专业" />
                  <select value={stage} onChange={(event) => setStage(event.target.value as (typeof stages)[number]["value"])} className="theme-input rounded-[16px] px-4 py-3 text-sm">
                    {stages.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-medium text-[var(--text-3)]">主平台（可多选）</div>
                  <div className="flex flex-wrap gap-2">
                    {surfaces.map((surface) => (
                      <button key={surface} type="button" onClick={() => toggleSurface(surface)} className={`rounded-full border px-3 py-1.5 text-xs transition ${platformPriority.includes(surface) ? "border-[var(--surface-strong)] bg-[var(--surface-strong)] text-[var(--text-inverse)]" : "border-[var(--border)] bg-[var(--surface-solid)] text-[var(--text-2)]"}`}>
                        {getPlatformSurfaceMeta(surface).label}
                      </button>
                    ))}
                  </div>
                </div>
                <TagInput value={forbidden} onChange={setForbidden} placeholder="输入禁止表达（可选）后按回车" />
                <TagInput value={keywordPool} onChange={setKeywordPool} placeholder="输入选题关键词后按回车，例如 SpaceX、火星移民、AI" />
                <div className="flex items-center gap-3">
                  <Button onClick={() => void createProfile()} disabled={pending !== null}>{pending === "brand" ? "创建中..." : "创建品牌档案"}</Button>
                  {message ? <div className="text-sm text-[var(--ok-text)]">{message}</div> : null}
                  {error ? <div className="text-sm text-[var(--danger-text)]">{error}</div> : null}
                </div>
              </div>
            </div>

            {activeProfile ? (
              <div className="theme-panel-muted rounded-[22px] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[var(--text-1)]">{activeProfile.brand_name}</div>
                    <div className="mt-1 text-sm text-[var(--text-2)]">{getStageLabel(activeProfile.brand_stage)} · {activeProfile.content_pillars.length} 个内容方向 · {activeProfile.projects.length} 个关联项目</div>
                  </div>
                  {projectId ? (
                    <Button variant="secondary" onClick={() => void attachToProject(activeProfile.id)} disabled={pending !== null}>
                      绑定到当前项目
                    </Button>
                  ) : null}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {activeProfile.platform_priority.map((item) => (
                    <span key={item} className="theme-pill rounded-full px-2.5 py-1 text-xs font-medium">{getPlatformSurfaceMeta(item as PlatformSurface).label}</span>
                  ))}
                </div>
                <Disclosure className="mt-4 rounded-[18px] border border-[var(--border)] bg-[var(--surface-solid)] p-4" summary="继续补充内容方向（可选）" defaultOpen={false}>
                  <div className="grid gap-3 pt-3">
                    <input value={pillarName} onChange={(event) => setPillarName(event.target.value)} className="theme-input rounded-[16px] px-4 py-3 text-sm" placeholder="内容方向名称，例如品牌故事型" />
                    <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
                      <select value={pillarType} onChange={(event) => setPillarType(event.target.value as (typeof pillarTypes)[number])} className="theme-input rounded-[16px] px-4 py-3 text-sm">
                        {pillarTypes.map((item) => (
                          <option key={item} value={item}>
                            {getPillarTypeLabel(item)}
                          </option>
                        ))}
                      </select>
                      <input value={pillarSummary} onChange={(event) => setPillarSummary(event.target.value)} className="theme-input rounded-[16px] px-4 py-3 text-sm" placeholder="这类内容主要承担什么营销作用" />
                    </div>
                    <TagInput value={pillarTopics} onChange={setPillarTopics} placeholder="输入推荐选题方向后按回车" />
                    <div className="flex items-center gap-3">
                      <Button variant="secondary" onClick={() => void createPillar()} disabled={pending !== null}>
                        {pending === "pillar" ? "保存中..." : "新增内容方向"}
                      </Button>
                    </div>
                  </div>
                </Disclosure>
              </div>
            ) : null}
          </div>
        </div>
      </PanelCard>

      <PanelCard title="品牌复用视图" description="先看这个品牌现在处于什么阶段、适合在哪些平台发声、有哪些表达边界。内容方向只保留关键信息。">
        {activeProfile ? (
          <div className="space-y-5">
            <div>
              <div className="text-2xl font-semibold tracking-tight text-[var(--text-1)]">{activeProfile.brand_name}</div>
              <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">{activeProfile.brand_positioning}</div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="theme-panel-muted rounded-[20px] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">品牌阶段</div>
                <div className="mt-3 text-lg font-semibold text-[var(--text-1)]">{getStageLabel(activeProfile.brand_stage)}</div>
              </div>
              <div className="theme-panel-muted rounded-[20px] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">内容支柱</div>
                <div className="mt-3 text-lg font-semibold text-[var(--text-1)]">{activeProfile.content_pillars.length}</div>
              </div>
            </div>
            <KeywordPoolEditor profileId={activeProfile.id} initialKeywords={activeProfile.keyword_pool} onSaved={() => router.refresh()} />
            <div className="theme-panel-muted rounded-[20px] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">禁用表达</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {activeProfile.forbidden_phrases.length ? activeProfile.forbidden_phrases.map((item) => <span key={item} className="theme-chip-danger rounded-full px-2.5 py-1 text-xs font-medium">{item}</span>) : <span className="text-sm text-[var(--text-2)]">当前未设置。</span>}
              </div>
            </div>
            <div className="space-y-3">
              {activeProfile.content_pillars.map((pillar) => (
                <div key={pillar.id} className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[var(--text-1)]">{pillar.pillar_name}</div>
                    <span className="theme-pill rounded-full px-2.5 py-1 text-xs font-medium">{getPillarTypeLabel(pillar.pillar_type)}</span>
                  </div>
                  <div className="mt-2 text-sm text-[var(--text-2)]">这是这个品牌的一个主要内容方向，可继续扩展更多选题。</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-[22px] border border-dashed border-[var(--border)] bg-[var(--surface-muted)] p-5 text-sm leading-7 text-[var(--text-2)]">
            先创建一个品牌档案，再把它绑定到具体项目。之后 brief、平台改写、合规检查都可以继承这层品牌约束。
          </div>
        )}
      </PanelCard>
    </div>
  );
}

function KeywordPoolEditor({
  profileId,
  initialKeywords,
  onSaved,
}: {
  profileId: string;
  initialKeywords: string[];
  onSaved: () => void;
}) {
  const [keywords, setKeywords] = useState<string[]>(initialKeywords);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const dirty = JSON.stringify(keywords) !== JSON.stringify(initialKeywords);

  async function save() {
    setSaving(true);
    setFeedback(null);
    try {
      const response = await fetch(`/api/brand-profiles/${profileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword_pool: keywords }),
      });
      const payload = (await response.json()) as { success: boolean; error?: { message?: string; detail?: string } };
      if (!payload.success) throw new Error(payload.error?.detail || payload.error?.message || "保存失败");
      setFeedback("✅ 关键词已保存");
      onSaved();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="theme-panel-muted rounded-[20px] p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">选题关键词池</div>
      <div className="mt-3">
        <TagInput value={keywords} onChange={setKeywords} placeholder="输入关键词后按回车，例如 SpaceX、火星移民、AI" />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button variant="secondary" onClick={() => void save()} disabled={saving || !dirty}>
          {saving ? "保存中..." : "保存关键词"}
        </Button>
        {feedback ? <span className="text-xs text-[var(--text-2)]">{feedback}</span> : null}
        {!dirty && keywords.length > 0 ? <span className="text-xs text-[var(--text-3)]">已同步 {keywords.length} 个关键词</span> : null}
      </div>
    </div>
  );
}
