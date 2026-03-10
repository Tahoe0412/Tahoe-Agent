import type { ReactNode } from "react";

export function AppShell({
  children,
  sidebar,
}: {
  children: ReactNode;
  sidebar: ReactNode;
}) {
  return (
    <div className="theme-shell">
      <div className="mx-auto grid min-h-screen max-w-[1560px] gap-6 px-4 py-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="theme-sidebar rounded-[30px] p-6">
          {sidebar}
        </aside>
        <main className="theme-main rounded-[34px] p-6 lg:p-8 xl:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
