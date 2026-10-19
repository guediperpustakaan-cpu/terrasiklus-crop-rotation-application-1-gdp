import type { SoilMetric, SoilReport, SoilStatus, SoilTest } from "./types";
import { clamp, daysBetween, todayISO } from "./utils";

/** Ambang interpretasi uji tanah (N, P, K dalam ppm; bahan organik dalam %). */
const RANGE = {
  n: { low: 15, high: 30 },
  p: { low: 10, high: 25 },
  k: { low: 100, high: 200 },
  om: { low: 2, high: 4 },
};

export function statusNutrien(value: number, range: { low: number; high: number }): SoilStatus {
  if (value < range.low) return "rendah";
  if (value > range.high) return "tinggi";
  return "ideal";
}

export function statusPh(value: number): SoilStatus {
  if (value < 5.5) return "kritis";
  if (value > 7.8) return "kritis";
  if (value < 6 || value > 7.5) return "rendah";
  return "ideal";
}

export const STATUS_LABEL: Record<SoilStatus, string> = {
  rendah: "Perlu perhatian",
  ideal: "Ideal",
  tinggi: "Berlebih",
  kritis: "Kritis",
};

export const STATUS_STYLE: Record<SoilStatus, string> = {
  ideal: "bg-leaf-100 text-leaf-800 ring-leaf-300",
  rendah: "bg-amber-100 text-amber-800 ring-amber-300",
  tinggi: "bg-sky-100 text-sky-800 ring-sky-300",
  kritis: "bg-clay-100 text-clay-800 ring-clay-300",
};

export const STATUS_BAR: Record<SoilStatus, string> = {
  ideal: "bg-leaf-600",
  rendah: "bg-amber-500",
  tinggi: "bg-sky-500",
  kritis: "bg-clay-600",
};

function ratio(value: number, min: number, max: number): number {
  return clamp(((value - min) / (max - min)) * 100, 4, 100);
}

const ADVICE: Record<SoilMetric["key"], Partial<Record<SoilStatus, string>>> = {
  ph: {
    kritis:
      "pH sangat menyimpang — sebagian besar hara terkunci. Beri kapur dolomit (jika asam) atau belerang/kompos asam (jika alkalis) lalu uji ulang 4–6 minggu kemudian.",
    rendah: "pH belum ideal. Tambahkan dolomit 1–2 kg per 10 m² atau kompos matang, lalu uji ulang sebelum tanam.",
    ideal: "pH berada pada jendela serap hara terbaik (6,0–7,5). Pertahankan dengan kompos rutin.",
    tinggi: "Unsur hara mikro bisa terkunci pada pH tinggi. Tambahkan kompos/bahan organik asam.",
  },
  n: {
    rendah: "Nitrogen rendah — daun akan kerdil & menguning. Tanam kacang-kacangan (Fabaceae) atau beri kompos/pupuk kandang matang.",
    ideal: "Nitrogen cukup untuk tanaman daun dan buah.",
    tinggi: "Nitrogen berlebih memicu pertumbuhan daun tanpa buah dan menarik hama kutu. Kurangi pupuk N, perbanyak kompos.",
    kritis: "Nitrogen sangat rendah. Lakukan pemupukan organik segera.",
  },
  p: {
    rendah: "Fosfor rendah menghambat pembentukan akar & bunga. Tambahkan tepung tulang atau rock phosphate.",
    ideal: "Fosfor cukup untuk pembungaan dan pembuahan.",
    tinggi: "Fosfor berlebih dapat mengunci serap Zn & Fe. Hentikan pemupukan P sementara.",
    kritis: "Fosfor sangat rendah — prioritaskan pembenahan tanah sebelum menanam tanaman buah.",
  },
  k: {
    rendah: "Kalium rendah membuat tanaman rentan rebah & buah kecil. Beri abu kayu/sekam atau pupuk K organik.",
    ideal: "Kalium cukup untuk kualitas buah dan daya tahan penyakit.",
    tinggi: "Kalium berlebih mengganggu serap Mg & Ca. Seimbangkan dengan kompos.",
    kritis: "Kalium sangat rendah. Pembenahan tanah wajib dilakukan.",
  },
  organicMatter: {
    rendah: "Bahan organik rendah (<2%) — struktur tanah lemah. Beri 2–4 kg kompos per m² dan pertimbangkan tanaman penutup tanah.",
    ideal: "Bahan organik sehat, daya simpan air dan kehidupan mikroba baik.",
    tinggi: "Bahan organik sangat tinggi — pastikan drainase tetap baik agar tidak anaerob.",
    kritis: "Bahan organik sangat rendah. Fokus pada mulsa dan kompos selama satu musim penuh.",
  },
};

export function buildSoilMetrics(test: SoilTest): SoilMetric[] {
  const phStatus = statusPh(test.ph);
  const metrics: SoilMetric[] = [
    {
      key: "ph",
      label: "pH Tanah",
      unit: "pH",
      value: test.ph,
      status: phStatus,
      statusLabel: STATUS_LABEL[phStatus],
      advice: ADVICE.ph[phStatus] ?? "",
      ratio: ratio(test.ph, 4, 9),
      optimalRange: "6,0 – 7,5",
    },
    {
      key: "n",
      label: "Nitrogen (N)",
      unit: "ppm",
      value: test.n,
      status: statusNutrien(test.n, RANGE.n),
      statusLabel: "",
      advice: "",
      ratio: ratio(test.n, 0, 60),
      optimalRange: "15 – 30 ppm",
    },
    {
      key: "p",
      label: "Fosfor (P)",
      unit: "ppm",
      value: test.p,
      status: statusNutrien(test.p, RANGE.p),
      statusLabel: "",
      advice: "",
      ratio: ratio(test.p, 0, 50),
      optimalRange: "10 – 25 ppm",
    },
    {
      key: "k",
      label: "Kalium (K)",
      unit: "ppm",
      value: test.k,
      status: statusNutrien(test.k, RANGE.k),
      statusLabel: "",
      advice: "",
      ratio: ratio(test.k, 0, 300),
      optimalRange: "100 – 200 ppm",
    },
    {
      key: "organicMatter",
      label: "Bahan Organik",
      unit: "%",
      value: test.organicMatter,
      status: statusNutrien(test.organicMatter, RANGE.om),
      statusLabel: "",
      advice: "",
      ratio: ratio(test.organicMatter, 0, 8),
      optimalRange: "2 – 4 %",
    },
  ];

  return metrics.map((metric) => ({
    ...metric,
    statusLabel: metric.statusLabel || STATUS_LABEL[metric.status],
    advice: metric.advice || ADVICE[metric.key][metric.status] || "",
  }));
}

export function buildSoilReport(test: SoilTest): SoilReport {
  const metrics = buildSoilMetrics(test);
  const weights = { ph: 1.2, n: 1, p: 0.9, k: 0.9, organicMatter: 1.3 };
  const scoreValue = { ideal: 100, rendah: 55, tinggi: 70, kritis: 25 } as Record<SoilStatus, number>;

  let total = 0;
  let weightSum = 0;
  for (const metric of metrics) {
    const w = weights[metric.key];
    total += scoreValue[metric.status] * w;
    weightSum += w;
  }
  const score = Math.round(total / weightSum);

  const grade =
    score >= 85 ? "Sangat Sehat" : score >= 70 ? "Sehat" : score >= 50 ? "Sedang" : score >= 35 ? "Kurang Sehat" : "Kritis";

  const actions = metrics
    .filter((metric) => metric.status !== "ideal")
    .map((metric) => `${metric.label}: ${metric.advice}`);

  const critical = metrics.filter((metric) => metric.status === "kritis" || metric.status === "rendah");
  const headline = critical.length === 0
    ? "Semua indikator tanah berada pada kondisi ideal — petak siap untuk musim tanam berikutnya."
    : `${critical.length} indikator perlu pembenahan: ${critical.map((metric) => metric.label).join(", ")}.`;

  return { test, score, grade, metrics, headline, actions };
}

export function soilTestAgeLabel(testedOn: string): string {
  const age = daysBetween(testedOn, todayISO());
  if (age <= 0) return "diuji hari ini";
  if (age < 30) return `diuji ${age} hari lalu`;
  if (age < 365) return `diuji ${Math.round(age / 30)} bulan lalu`;
  return `diuji ${Math.round(age / 365)} tahun lalu`;
}

export function soilTestIsStale(testedOn: string | null | undefined): boolean {
  if (!testedOn) return true;
  return daysBetween(testedOn, todayISO()) > 120;
}
