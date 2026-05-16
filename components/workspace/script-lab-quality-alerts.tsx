import type { QualityAlert } from "@/lib/artifact-quality";

export function QualityAlertList({ alerts }: { alerts: QualityAlert[] }) {
  if (!alerts.length) {
    return null;
  }

  return (
    <div className="grid gap-2">
      {alerts.map((alert) => (
        <div
          key={`${alert.label}:${alert.detail}`}
          className={`rounded-[14px] border px-3 py-2 text-sm leading-6 ${
            alert.tone === "ok"
              ? "border-[color:color-mix(in_srgb,var(--ok-text)_24%,transparent)] bg-[var(--ok-bg)] text-[var(--ok-text)]"
              : "border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning-text)]"
          }`}
        >
          <span className="font-semibold">{alert.label}</span>
          <span className="ml-2">{alert.detail}</span>
        </div>
      ))}
    </div>
  );
}
