import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { PanelCard } from "@/components/ui/panel-card";
import { WorkspaceLayout } from "@/components/workspace/layout";
import { copy, getLocale } from "@/lib/locale";
import { WorkspaceQueryService } from "@/services/workspace-query.service";

const workspaceQueryService = new WorkspaceQueryService();

export const dynamic = "force-dynamic";

export default async function HelpCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const locale = await getLocale();
  const text = copy[locale];
  const { projectId } = await searchParams;
  const workspace = projectId ? await workspaceQueryService.getProjectWorkspace(projectId) : null;

  const modeLabel =
    workspace?.workspaceMode === "SHORT_VIDEO"
      ? "短视频"
      : workspace?.workspaceMode === "COPYWRITING"
        ? "文案写作"
        : workspace?.workspaceMode === "PROMOTION"
          ? "宣传推广"
          : null;

  return (
    <WorkspaceLayout locale={locale} workspaceMode={workspace?.workspaceMode}>
      <div className="space-y-8">
        <PageHeader
          eyebrow={text.pages.help.eyebrow}
          title={text.pages.help.title}
          description={text.pages.help.description}
        />

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <PanelCard title="先这样开始" description="第一次使用时，不要试图把所有模块都看完，先跑通一个项目。">
            <div className="space-y-4 text-sm leading-7 text-[var(--text-2)]">
              <div className="rounded-2xl bg-[var(--surface-muted)] p-4">
                1. 新建项目
                <br />
                2. 选择工作模式
                <br />
                3. 填写项目介绍、核心想法、原始输入
                <br />
                4. 如果是文案类项目，再设置写作模式、输出风格、文案长度、使用场景
                <br />
                5. 需要时补 `风格参照 / 参考样稿`
                <br />
                6. 先生成第一版，再增强
              </div>
              <div>
                当前{modeLabel ? `项目模式是「${modeLabel}」` : "还没有选定项目"}。如果你只想先跑通一个完整流程，优先从“总览 → 趋势研究 → 宣传文案与运营”这条最短路径开始。
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href={projectId ? `/?projectId=${projectId}` : "/"} className="rounded-full border border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-2 text-sm font-medium text-[var(--accent-strong)]">
                  返回总览
                </Link>
                <Link href={projectId ? `/marketing-ops?projectId=${projectId}` : "/marketing-ops"} className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-2)]">
                  去宣传文案与运营
                </Link>
              </div>
            </div>
          </PanelCard>

          <PanelCard title="三种工作模式" description="模式不同，页面导航和推荐流程会自动收缩。">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-[var(--surface-muted)] p-4">
                <div className="text-base font-semibold text-[var(--text-1)]">短视频</div>
                <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">
                  更关注：趋势、脚本重构、镜头拆解、分镜与素材准备。
                </div>
              </div>
              <div className="rounded-2xl bg-[var(--surface-muted)] p-4">
                <div className="text-base font-semibold text-[var(--text-1)]">文案写作</div>
                <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">
                  更关注：任务单、宣传主稿、平台稿和文案质量增强。
                </div>
              </div>
              <div className="rounded-2xl bg-[var(--surface-muted)] p-4">
                <div className="text-base font-semibold text-[var(--text-1)]">宣传推广</div>
                <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">
                  更关注：推广目标、平台适配、合规检查和复盘优化。
                </div>
              </div>
            </div>
          </PanelCard>
        </div>

        <PanelCard title="主要页面怎么用" description="先理解每个页面只负责什么，再开始操作，会更顺。">
          <div className="grid gap-4 xl:grid-cols-3">
            {[
              ["总览", "看当前项目、推荐下一步，并决定是继续还是新建。"],
              ["创意任务单", "把目标、核心表达和 CTA 先写清楚。"],
              ["趋势研究", "默认只看最值得做的 1 个主题，再看 2 个备选。"],
              ["脚本实验台", "先修改 AI 重构文本，其他高级字段按需展开。"],
              ["分镜编排", "先判断镜头能不能开工、缺什么素材，再看高级参数。"],
              ["宣传文案与运营", "先生成主稿，再增强、派生平台稿、做合规检查。"],
              ["品牌档案", "沉淀品牌 voice、禁用表达和内容支柱。"],
              ["行业模板", "沉淀行业边界、竞品关键词和风险词。"],
              ["项目中心", "统一搜索、筛选、置顶和归档多个项目。"],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-2xl bg-[var(--surface-muted)] p-4">
                <div className="text-base font-semibold text-[var(--text-1)]">{title}</div>
                <div className="mt-2 text-sm leading-7 text-[var(--text-2)]">{desc}</div>
              </div>
            ))}
          </div>
        </PanelCard>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <PanelCard title="如何提高文案质量" description="不要只反复点生成，先把输入质量提上去。">
            <div className="space-y-3 text-sm leading-7 text-[var(--text-2)]">
              <div className="rounded-2xl bg-[var(--surface-muted)] p-4">
                优先写清这几项：
                <br />- 项目介绍
                <br />- 核心想法
                <br />- 原始输入
                <br />- 写作模式
                <br />- 输出风格
                <br />- 文案长度
                <br />- 使用场景
                <br />- 风格参照 / 参考样稿
              </div>
              <div>如果第一版不够好，优先用“诊断并增强主稿”，不要直接换十几次 prompt。系统已经会给你质量分、问题和增强重点，再生成更强的新版本。</div>
              <div>参考样稿建议贴 1 到 3 段完整文案。系统会学习语气、节奏、句长、段落结构和情绪推进，但不会照抄内容。</div>
            </div>
          </PanelCard>

          <PanelCard title="常见问题" description="先看这里，能解决大部分初期困惑。">
            <div className="space-y-4 text-sm leading-7 text-[var(--text-2)]">
              <div>
                <div className="font-medium text-[var(--text-1)]">为什么生成结果像摘要，不像宣传文案？</div>
                <div className="mt-1">通常是因为项目介绍、核心想法或使用场景没写清楚，或者没有提供参考样稿。优先补输入，再点“诊断并增强主稿”。</div>
              </div>
              <div>
                <div className="font-medium text-[var(--text-1)]">为什么我找不到某个模块？</div>
                <div className="mt-1">系统会按项目模式自动收缩导航。短视频、文案写作、宣传推广看到的重点模块不完全一样。</div>
              </div>
              <div>
                <div className="font-medium text-[var(--text-1)]">为什么不建议直接删除项目？</div>
                <div className="mt-1">项目里沉淀的是资产，包括趋势、任务单、脚本、平台稿和合规记录。建议先归档，不要轻易硬删除。</div>
              </div>
            </div>
          </PanelCard>
        </div>

        <PanelCard title="版本更新记录" description="功能变化会先记在这里，再同步到手册。">
          <div className="space-y-3 text-sm leading-7 text-[var(--text-2)]">
            <div>你可以在文档里查看完整记录：</div>
            <div className="flex flex-wrap gap-3">
              <Link href="/settings" className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-2)]">
                去设置页
              </Link>
              <a href="/api/health" target="_blank" rel="noreferrer" className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-2)]">
                健康检查
              </a>
            </div>
            <div className="rounded-2xl bg-[var(--surface-muted)] p-4">
              当前建议维护方式：
              <br />1. 每次版本先更新 release notes
              <br />2. 如果流程和页面有变化，再同步更新用户手册
              <br />3. 手册只写用户需要知道的内容，不写底层开发细节
            </div>
          </div>
        </PanelCard>
      </div>
    </WorkspaceLayout>
  );
}
