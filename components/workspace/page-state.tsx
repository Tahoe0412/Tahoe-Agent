import type { PageState } from "@/lib/demo-workspace-data";
import type { Locale } from "@/lib/locale-copy";
import { EmptyPanel, ErrorPanel, LoadingPanel } from "@/components/ui/state-panel";

export function PageStateView({ state, locale = "zh" }: { state: PageState; locale?: Locale }) {
  if (state === "loading") {
    return <LoadingPanel locale={locale} />;
  }

  if (state === "empty") {
    return <EmptyPanel locale={locale} />;
  }

  if (state === "error") {
    return <ErrorPanel locale={locale} />;
  }

  return null;
}
