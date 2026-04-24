import type { TFunction } from "i18next";

/**
 * Returns a localized relative-time string for an ISO timestamp.
 * Buckets: just now (<60s), N min (<60m), N h (<24h), N d (<14d), fallback on date.
 */
export function formatRelative(
  iso: string | null | undefined,
  t: TFunction
): string {
  if (!iso) return t("common.never");
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return t("common.never");
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));

  if (diffSec < 60) return t("time.justNow");
  if (diffSec < 3600) return t("time.minutesAgo", { n: Math.floor(diffSec / 60) });
  if (diffSec < 86400) return t("time.hoursAgo", { n: Math.floor(diffSec / 3600) });
  if (diffSec < 86400 * 14) return t("time.daysAgo", { n: Math.floor(diffSec / 86400) });

  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return t("time.atDate", { date });
}
