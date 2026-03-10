import type { PageState } from "@/lib/demo-workspace-data";
import { EmptyPanel, ErrorPanel, LoadingPanel } from "@/components/ui/state-panel";

export function PageStateView({ state }: { state: PageState }) {
  if (state === "loading") {
    return <LoadingPanel />;
  }

  if (state === "empty") {
    return <EmptyPanel />;
  }

  if (state === "error") {
    return <ErrorPanel />;
  }

  return null;
}
