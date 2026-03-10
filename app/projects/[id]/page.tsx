import Link from "next/link";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-amber-600">Project Detail</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">项目 {id}</h1>
          </div>
          <Link href="/" className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700">
            返回首页
          </Link>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm leading-7 text-slate-600">
          这里预留为项目详情页。后续可从数据库读取趋势报告、脚本版本、镜头拆解和素材依赖，按项目维度展示完整生产编排结果。
        </div>
      </div>
    </main>
  );
}
