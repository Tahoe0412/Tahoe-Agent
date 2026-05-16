import Link from "next/link";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-[var(--canvas)] px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.12em] text-[var(--accent-strong)]">Project Detail</p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--text-1)]">项目 {id}</h1>
          </div>
          <Link href="/" className="rounded-sm border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-2)]">
            返回首页
          </Link>
        </div>

        <div className="rounded-md border border-[var(--border)] bg-[var(--surface-solid)] p-6 text-sm leading-7 text-[var(--text-2)]">
          这里预留为项目详情页。后续可从数据库读取趋势报告、脚本版本、镜头拆解和素材依赖，按项目维度展示完整生产编排结果。
        </div>
      </div>
    </main>
  );
}
