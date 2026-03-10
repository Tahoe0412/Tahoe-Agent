"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DetailPanel } from "@/components/ui/detail-panel";
import { PanelCard } from "@/components/ui/panel-card";

const objectives = ["AWARENESS", "CONSIDERATION", "CONVERSION", "RETENTION", "LAUNCH"] as const;
const tones = ["PREMIUM", "DIRECT", "PLAYFUL", "TECHNICAL", "HUMAN", "CINEMATIC"] as const;
const awarenessLevels = ["COLD", "WARM", "HOT"] as const;
const publishingPlatforms = [
  "XIAOHONGSHU",
  "DOUYIN",
  "YOUTUBE",
  "X",
  "TIKTOK",
  "BRAND_PAGE",
] as const;
const callToActionPresets = ["了解品牌", "查看产品", "预约体验", "进店咨询", "加入社群"] as const;

function getObjectiveMeta(objective: (typeof objectives)[number]) {
  const meta = {
    AWARENESS: { label: "先让用户知道我们", description: "适合品牌露出、建立第一印象和基础认知。" },
    CONSIDERATION: { label: "让用户开始认真考虑", description: "适合解释价值、建立信任和拉近决策距离。" },
    CONVERSION: { label: "推动用户立刻行动", description: "适合咨询、预约、购买、报名等明确转化目标。" },
    RETENTION: { label: "让老用户继续回来", description: "适合复购、复访、持续互动和长期关系维护。" },
    LAUNCH: { label: "配合新品或活动发布", description: "适合新品上线、节日活动、门店开业等节点传播。" },
  } as const;

  return meta[objective];
}

function getToneMeta(tone: (typeof tones)[number]) {
  const meta = {
    PREMIUM: "高级克制",
    DIRECT: "直接清楚",
    PLAYFUL: "轻松有趣",
    TECHNICAL: "专业理性",
    HUMAN: "温和真诚",
    CINEMATIC: "画面感强",
  } as const;

  return meta[tone];
}

function getAwarenessLabel(level: (typeof awarenessLevels)[number]) {
  const meta = {
    COLD: "完全陌生",
    WARM: "有点了解",
    HOT: "已经较熟悉",
  } as const;

  return meta[level];
}

function getPlatformLabel(platform: (typeof publishingPlatforms)[number]) {
  const meta = {
    XIAOHONGSHU: "小红书",
    DOUYIN: "抖音",
    YOUTUBE: "YouTube",
    X: "X",
    TIKTOK: "TikTok",
    BRAND_PAGE: "品牌页 / 官网",
  } as const;

  return meta[platform];
}

function getPlatformDescription(platform: (typeof publishingPlatforms)[number]) {
  const meta = {
    XIAOHONGSHU: "适合品牌种草、图文正文、生活方式内容。",
    DOUYIN: "适合短视频传播、口播内容、强钩子表达。",
    YOUTUBE: "适合长视频、深度内容、国际平台分发。",
    X: "适合短帖观点、热点评论、话题传播。",
    TIKTOK: "适合海外短视频传播与测试爆点。",
    BRAND_PAGE: "适合品牌介绍页、活动页、官网长文内容。",
  } as const;

  return meta[platform];
}

function getBriefStatusLabel(status: BriefRow["brief_status"]) {
  const meta = {
    DRAFT: "草稿",
    ACTIVE: "当前使用",
    APPROVED: "已确认",
    ARCHIVED: "已归档",
  } as const;

  return meta[status];
}

type BriefRow = {
  id: string;
  version_number: number;
  title: string;
  campaign_name: string | null;
  objective: (typeof objectives)[number];
  primary_tone: (typeof tones)[number];
  audience_awareness: (typeof awarenessLevels)[number] | null;
  target_platforms: string[];
  key_message: string;
  call_to_action: string | null;
  target_audience: string | null;
  duration_target_sec: number | null;
  brief_status: "DRAFT" | "ACTIVE" | "APPROVED" | "ARCHIVED";
  constraints: Array<{
    id: string;
    constraint_type: string;
    constraint_label: string;
    constraint_value: string | null;
    is_hard_constraint: boolean;
  }>;
};

function BriefPill({ children }: { children: React.ReactNode }) {
  return <span className="theme-pill rounded-full px-2.5 py-1 text-xs font-medium">{children}</span>;
}

export function BriefStudioWorkbench({
  projectId,
  briefs,
  defaultTopic,
}: {
  projectId: string;
  briefs: BriefRow[];
  defaultTopic: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(defaultTopic || "新建创意任务单");
  const [campaignName, setCampaignName] = useState("");
  const [objective, setObjective] = useState<(typeof objectives)[number]>("AWARENESS");
  const [tone, setTone] = useState<(typeof tones)[number]>("PREMIUM");
  const [audienceAwareness, setAudienceAwareness] = useState<(typeof awarenessLevels)[number]>("COLD");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["XIAOHONGSHU", "DOUYIN"]);
  const [keyMessage, setKeyMessage] = useState("");
  const [callToAction, setCallToAction] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [durationSec, setDurationSec] = useState(30);
  const [constraintsText, setConstraintsText] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedBriefId, setSelectedBriefId] = useState(briefs[0]?.id ?? "");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeBrief = useMemo(() => briefs.find((item) => item.id === selectedBriefId) ?? briefs[0] ?? null, [briefs, selectedBriefId]);

  function togglePlatform(platform: string) {
    setSelectedPlatforms((current) => {
      if (current.includes(platform)) {
        return current.filter((item) => item !== platform);
      }
      return [...current, platform];
    });
  }

  async function createBrief() {
    setPending(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/briefs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          campaign_name: campaignName || undefined,
          objective,
          primary_tone: tone,
          audience_awareness: audienceAwareness,
          target_platforms: selectedPlatforms,
          key_message: keyMessage,
          call_to_action: callToAction || undefined,
          target_audience: targetAudience || undefined,
          duration_target_sec: durationSec,
          constraints: constraintsText
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line, index) => ({
              constraint_type: "STYLE",
              constraint_code: `STYLE_${index + 1}`,
              constraint_label: line,
              constraint_value: line,
              is_hard_constraint: false,
            })),
        }),
      });
      const payload = (await response.json()) as { success: boolean; error?: { message?: string } };
      if (!payload.success) {
        throw new Error(payload.error?.message || "创建 brief 失败。");
      }

      setMessage("任务单已创建。");
      setKeyMessage("");
      setConstraintsText("");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "创建 brief 失败。");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
      <PanelCard title="快速任务单" description="先把目标、核心表达、平台和 CTA 写清楚。其余细节先收进高级设置。">
        <div className="grid gap-5 lg:grid-cols-[0.58fr_1fr]">
          <div className="space-y-3">
            {briefs.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-[var(--border)] bg-[var(--surface-muted)] p-5 text-sm leading-7 text-[var(--text-2)]">
                当前项目还没有任务单。先写清楚目标、平台、核心表达和行动号召，就够开始往下走了。
              </div>
            ) : (
              briefs.map((brief) => (
                <button
                  key={brief.id}
                  type="button"
                  onClick={() => setSelectedBriefId(brief.id)}
                  className={`w-full rounded-[24px] border p-4 text-left transition ${
                    brief.id === activeBrief?.id
                      ? "theme-panel-strong border-transparent"
                      : "border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface-solid)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold">{brief.title}</div>
                      <div className={`mt-1 text-xs ${brief.id === activeBrief?.id ? "text-[color:rgba(246,240,232,0.72)]" : "text-[var(--text-2)]"}`}>
                        第 {brief.version_number} 版
                      </div>
                    </div>
                    <BriefPill>{getObjectiveMeta(brief.objective).label}</BriefPill>
                  </div>
                  <div className={`mt-3 line-clamp-3 text-sm leading-6 ${brief.id === activeBrief?.id ? "text-[color:rgba(246,240,232,0.84)]" : "text-[var(--text-2)]"}`}>{brief.key_message}</div>
                </button>
              ))
            )}
          </div>

          <div className="space-y-4">
            <div className="theme-panel-muted rounded-[24px] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">第一步：项目目标</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">任务单标题</span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="theme-input rounded-[16px] px-4 py-3 text-sm"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">目标</span>
                  <select
                    value={objective}
                    onChange={(event) => setObjective(event.target.value as (typeof objectives)[number])}
                    className="theme-input min-w-0 rounded-[16px] px-4 py-3 text-sm"
                  >
                    {objectives.map((item) => (
                      <option key={item} value={item}>
                        {getObjectiveMeta(item).label}
                      </option>
                    ))}
                  </select>
                  <span className="text-sm text-[var(--text-2)]">{getObjectiveMeta(objective).description}</span>
                </label>
              </div>
            </div>

            <div className="theme-panel-muted rounded-[24px] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">第二步：平台与动作</div>
              <div className="mt-5">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">发布平台</div>
                <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">
                  这里选的是这轮内容准备发到哪里，不是数据抓取来源。做国内品牌传播，通常先选“小红书 + 抖音”；做品牌长文，再加“品牌页 / 官网”。
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {publishingPlatforms.map((platform) => {
                    const active = selectedPlatforms.includes(platform);
                    return (
                      <button
                        key={platform}
                        type="button"
                        onClick={() => togglePlatform(platform)}
                        className={`rounded-full border px-3 py-1.5 text-sm transition ${
                          active
                            ? "border-[var(--surface-strong)] bg-[var(--surface-strong)] text-[var(--text-inverse)]"
                            : "border-[var(--border)] bg-[var(--surface-solid)] text-[var(--text-2)] hover:bg-[var(--surface-muted)]"
                        }`}
                      >
                        {getPlatformLabel(platform)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {selectedPlatforms.map((platform) => (
                  <div key={platform} className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-3">
                    <div className="text-sm font-medium">{getPlatformLabel(platform as (typeof publishingPlatforms)[number])}</div>
                    <div className="mt-1 text-sm leading-6 text-[var(--text-2)]">
                      {getPlatformDescription(platform as (typeof publishingPlatforms)[number])}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-[1fr_0.9fr]">
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">行动号召</span>
                  <input
                    value={callToAction}
                    onChange={(event) => setCallToAction(event.target.value)}
                    className="theme-input rounded-[16px] px-4 py-3 text-sm"
                    placeholder="例如：立即咨询 / 预约体验 / 进店了解"
                  />
                  <div className="flex flex-wrap gap-2">
                    {callToActionPresets.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setCallToAction(item)}
                        className={`rounded-full border px-3 py-1.5 text-sm transition ${
                          callToAction === item
                            ? "border-[var(--surface-strong)] bg-[var(--surface-strong)] text-[var(--text-inverse)]"
                            : "border-[var(--border)] bg-[var(--surface-solid)] text-[var(--text-2)] hover:bg-[var(--surface-muted)]"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </label>
                <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-solid)] px-4 py-3 text-sm leading-7 text-[var(--text-2)]">
                  先只选最关键的发布平台和行动号召就够了。活动名、风格边界、时长和约束都可以后面再补。
                </div>
              </div>
            </div>

            <div className="theme-panel-muted rounded-[24px] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">第三步：核心表达</div>
              <div className="mt-4 grid gap-4">
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">核心表达</span>
                  <textarea
                    value={keyMessage}
                    onChange={(event) => setKeyMessage(event.target.value)}
                    rows={5}
                    className="theme-input rounded-[18px] px-4 py-3 text-sm leading-7"
                    placeholder="这次广告究竟要让用户理解什么、记住什么、行动什么。"
                  />
                </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" type="button" onClick={() => setShowAdvanced((value) => !value)}>
                {showAdvanced ? "收起高级设置" : "展开高级设置"}
              </Button>
            </div>

            {showAdvanced ? (
              <div className="theme-panel-muted rounded-[24px] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">高级设置</div>
                <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">
                  这些内容不是启动项目的必须项。只有当你需要更细地控制表达时，再补进去。
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(220px,0.95fr)]">
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">活动名（可选）</span>
                    <input
                      value={campaignName}
                      onChange={(event) => setCampaignName(event.target.value)}
                      className="theme-input rounded-[16px] px-4 py-3 text-sm"
                      placeholder="例如：春季上新 / 门店活动"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">表达气质（可选）</span>
                    <select
                      value={tone}
                      onChange={(event) => setTone(event.target.value as (typeof tones)[number])}
                      className="theme-input min-w-0 rounded-[16px] px-4 py-3 text-sm"
                    >
                      {tones.map((item) => (
                        <option key={item} value={item}>
                          {getToneMeta(item)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 md:col-span-2 xl:col-span-1">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">用户熟悉程度（可选）</span>
                    <select
                      value={audienceAwareness}
                      onChange={(event) => setAudienceAwareness(event.target.value as (typeof awarenessLevels)[number])}
                      className="theme-input min-w-0 rounded-[16px] px-4 py-3 text-sm"
                    >
                      {awarenessLevels.map((item) => (
                        <option key={item} value={item}>
                          {getAwarenessLabel(item)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 md:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">目标受众（可选）</span>
                    <input
                      value={targetAudience}
                      onChange={(event) => setTargetAudience(event.target.value)}
                      className="theme-input rounded-[16px] px-4 py-3 text-sm"
                      placeholder="例如：25-35 岁城市白领女性"
                    />
                  </label>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-[180px_1fr]">
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">目标时长（可选）</span>
                    <input
                      type="number"
                      min={5}
                      max={300}
                      value={durationSec}
                      onChange={(event) => setDurationSec(Number(event.target.value))}
                      className="theme-input rounded-[16px] px-4 py-3 text-sm"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-3)]">补充要求（可选）</span>
                    <textarea
                      value={constraintsText}
                      onChange={(event) => setConstraintsText(event.target.value)}
                      rows={4}
                      className="theme-input rounded-[18px] px-4 py-3 text-sm leading-7"
                      placeholder={"每行一条，例如：\n避免空泛宏大口号\n优先强调品牌可信度\n开头 3 秒必须有明确钩子"}
                    />
                  </label>
                </div>
              </div>
            ) : null}

            <div className="flex items-center gap-3">
              <Button onClick={() => void createBrief()} disabled={pending || selectedPlatforms.length === 0 || keyMessage.trim().length < 10}>
                {pending ? "创建中..." : "创建新版本"}
              </Button>
              {message ? <div className="text-sm text-[var(--ok-text)]">{message}</div> : null}
              {error ? <div className="text-sm text-[var(--danger-text)]">{error}</div> : null}
            </div>
          </div>
        </div>
      </PanelCard>

      <DetailPanel title={activeBrief ? `任务单 v${activeBrief.version_number}` : "填写建议"} className="xl:sticky xl:top-6 xl:self-start">
        {activeBrief ? (
          <>
            <div>
              <div className="text-xl font-semibold text-[var(--text-inverse)]">{activeBrief.title}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <BriefPill>{getObjectiveMeta(activeBrief.objective).label}</BriefPill>
                <BriefPill>{getToneMeta(activeBrief.primary_tone)}</BriefPill>
                {activeBrief.audience_awareness ? <BriefPill>{getAwarenessLabel(activeBrief.audience_awareness)}</BriefPill> : null}
                <BriefPill>{getBriefStatusLabel(activeBrief.brief_status)}</BriefPill>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-[var(--text-inverse)]">核心表达</div>
              <div className="mt-3 text-sm leading-7 text-[color:rgba(246,240,232,0.78)]">{activeBrief.key_message}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-[var(--text-inverse)]">目标与平台</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {activeBrief.target_platforms.map((item) => (
                  <BriefPill key={item}>{getPlatformLabel(item as (typeof publishingPlatforms)[number])}</BriefPill>
                ))}
                {activeBrief.duration_target_sec ? <BriefPill>{activeBrief.duration_target_sec}s</BriefPill> : null}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-[var(--text-inverse)]">约束条件</div>
              <div className="mt-3 space-y-2">
                {activeBrief.constraints.length ? (
                  activeBrief.constraints.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-[rgba(255,255,255,0.1)] px-3 py-2">
                      <div className="text-sm text-[var(--text-inverse)]">{item.constraint_label}</div>
                      <div className="text-xs text-[color:rgba(246,240,232,0.58)]">
                        {item.is_hard_constraint ? "重要约束" : "补充建议"}
                      </div>
                    </div>
                  ))
                ) : (
                  <div>当前 brief 还没有结构化约束。</div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div>先把商业目标、受众、CTA 和风格边界写成 brief，后面所有研究、脚本和分镜都围绕它展开。</div>
            <div>建议至少明确：目标平台、核心信息、受众热度、时长目标、不能踩的风格边界。</div>
          </>
        )}
      </DetailPanel>
    </div>
  );
}
