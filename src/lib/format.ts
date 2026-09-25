import type { Dict, Locale } from "@/i18n";
import type { Difficulty } from "./types";

/**
 * Deterministic number formatting (Azerbaijani: 1.234,5 · English: 1,234.5). Same as the website,
 * and independent of Hermes' Intl support.
 */
export function formatNumber(locale: Locale, n: number, digits = 0): string {
  const factor = 10 ** digits;
  const rounded = Math.round(n * factor) / factor;
  const [int, frac] = Math.abs(rounded).toFixed(digits).split(".");
  const [group, decimal] = locale === "az" ? [".", ","] : [",", "."];
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, group);
  const fraction = frac && Number(frac) !== 0 ? decimal + frac.replace(/0+$/, "") : "";
  return (rounded < 0 ? "-" : "") + grouped + fraction;
}

export function formatDuration(minutes: number, dict: Dict): string {
  const { h: hUnit, min: mUnit } = dict.common;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} ${mUnit}`;
  return m ? `${h} ${hUnit} ${m} ${mUnit}` : `${h} ${hUnit}`;
}

export function formatDistance(km: number, locale: Locale, dict: Dict): string {
  return `${formatNumber(locale, km, km < 10 ? 1 : 0)} ${dict.common.km}`;
}

export function formatMetres(m: number, locale: Locale, dict: Dict): string {
  return `${formatNumber(locale, m)} ${dict.common.m}`;
}

export function formatDate(iso: string, dict: Dict, locale: Locale): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const month = dict.common.months[d.getMonth()];
  return locale === "az" ? `${d.getDate()} ${month} ${d.getFullYear()}` : `${month} ${d.getDate()}, ${d.getFullYear()}`;
}

export const DIFFICULTIES: Difficulty[] = ["easy", "moderate", "hard", "expert"];
export const FEATURES = ["waterfall", "lake", "summit", "village", "historic", "forest", "river", "views"] as const;
export const PLACE_TYPES = ["waterfall", "lake", "peak", "village", "historic", "park"] as const;
export const DURATIONS = ["90", "180", "300", "600"] as const;
