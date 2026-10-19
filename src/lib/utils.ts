/** Utilitas tanggal & tampilan (seluruh label dalam Bahasa Indonesia). */

const BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const BULAN_SINGKAT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export function toISODate(value: Date): string {
  const y = value.getFullYear();
  const m = `${value.getMonth() + 1}`.padStart(2, "0");
  const d = `${value.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseISODate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function today(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function todayISO(): string {
  return toISODate(today());
}

export function addDays(value: Date | string, days: number): Date {
  const base = typeof value === "string" ? parseISODate(value) : new Date(value.getTime());
  base.setDate(base.getDate() + days);
  return base;
}

export function addDaysISO(value: string, days: number): string {
  return toISODate(addDays(value, days));
}

export function daysBetween(from: Date | string, to: Date | string): number {
  const a = typeof from === "string" ? parseISODate(from) : from;
  const b = typeof to === "string" ? parseISODate(to) : to;
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export function formatTanggal(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const iso = typeof value === "string" ? value.slice(0, 10) : toISODate(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = parseISODate(iso);
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTanggalSingkat(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const iso = typeof value === "string" ? value.slice(0, 10) : toISODate(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = parseISODate(iso);
  return `${d.getDate()} ${BULAN_SINGKAT[d.getMonth()]} ${`${d.getFullYear()}`.slice(2)}`;
}

export function formatRelatif(value: string | null | undefined, base: string = todayISO()): string {
  if (!value) return "—";
  const diff = daysBetween(base, value);
  if (diff === 0) return "hari ini";
  if (diff === 1) return "besok";
  if (diff === -1) return "kemarin";
  if (diff > 1) return `${diff} hari lagi`;
  return `${Math.abs(diff)} hari lalu`;
}

export function bulanLabel(value: string | Date): string {
  const d = typeof value === "string" ? parseISODate(value.slice(0, 10)) : value;
  return `${BULAN_SINGKAT[d.getMonth()]} ${d.getFullYear()}`;
}

export function musimLabel(value: string | Date): string {
  const d = typeof value === "string" ? parseISODate(value.slice(0, 10)) : value;
  const month = d.getMonth();
  const musim = month >= 3 && month <= 9 ? "Musim Kemarau" : "Musim Hujan";
  return `${musim} ${d.getFullYear()}`;
}

export function classNames(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function formatNumber(value: number, digits = 0): string {
  return value.toLocaleString("id-ID", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export const SOIL_TYPES = [
  { value: "lempung", label: "Lempung (loam)" },
  { value: "lempung berpasir", label: "Lempung berpasir" },
  { value: "berpasir", label: "Berpasir" },
  { value: "liat", label: "Liat (clay)" },
  { value: "lanau", label: "Lanau (silt)" },
  { value: "volkanis", label: "Volkanis / andosol" },
  { value: "gambut", label: "Gambut" },
  { value: "grumosol", label: "Grumosol" },
];

export function soilTypeLabel(value: string): string {
  const found = SOIL_TYPES.find((item) => item.value === value);
  if (found) return found.label;
  return value.charAt(0).toUpperCase() + value.slice(1);
}
