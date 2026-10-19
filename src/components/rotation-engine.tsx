"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  CalendarClock,
  CheckCircle2,
  Info,
  Recycle,
  Sparkles,
  Sprout,
} from "lucide-react";
import { Callout, DemandTag, EmptyState, FamilyTag, ScoreBar, VerdictTag } from "@/components/ui";
import { NUTRIENT_LABEL, ROLE_LABEL, VERDICT_META } from "@/lib/rotation";
import type { Crop, Recommendation, RotationAnalysis } from "@/lib/types";
import { classNames, formatTanggal, formatTanggalSingkat, todayISO } from "@/lib/utils";

function AlertCard({ alert }: { alert: RotationAnalysis["alerts"][number] }) {
  const level = alert.level === "bahaya" ? "bahaya" : alert.level === "peringatan" ? "peringatan" : "sukses";
  const icon = alert.level === "bahaya" ? AlertTriangle : alert.level === "peringatan" ? Info : CheckCircle2;
  return (
    <Callout level={level} title={alert.title} icon={icon}>
      <p>{alert.detail}</p>
    </Callout>
  );
}

function RecommendationCard({
  recommendation,
  rank,
  onPlant,
}: {
  recommendation: Recommendation;
  rank: number;
  onPlant: (crop: Crop) => void;
}) {
  const [open, setOpen] = useState(rank <= 2);
  const meta = VERDICT_META[recommendation.verdict];

  return (
    <article
      className="group card relative overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:border-leaf-300 hover:shadow-lift"
      style={{ borderLeft: `3px solid ${recommendation.family.color}` }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10.5px] font-bold tracking-[0.14em] text-bark-400 uppercase">Pilihan #{rank}</p>
            <h4 className="mt-0.5 truncate font-display text-[15px] font-extrabold text-bark-900">
              {recommendation.crop.commonName}
            </h4>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display text-2xl leading-none font-extrabold text-bark-900 tabular-nums">
              {recommendation.score}
            </p>
            <p className="text-[10px] font-semibold text-bark-500">skor rotasi</p>
          </div>
        </div>

        <ScoreBar score={recommendation.score} className="mt-3" />

        <div className="mt-3 flex flex-wrap gap-1.5">
          <FamilyTag family={recommendation.family} compact />
          <DemandTag demand={recommendation.crop.nutrientDemand} />
          <VerdictTag verdict={recommendation.verdict} />
        </div>

        <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-bark-500">
          <CalendarClock className="size-3.5" aria-hidden />
          Perkiraan panen {formatTanggalSingkat(recommendation.estimatedHarvestOn)} (±{recommendation.crop.harvestDays} hari)
        </p>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="mt-3 flex items-center gap-1.5 text-[11.5px] font-bold text-leaf-700 transition hover:text-leaf-800"
          aria-expanded={open}
        >
          {open ? "Sembunyikan alasan" : "Lihat alasan lengkap"}
          <ArrowRight className={classNames("size-3.5 transition-transform", open && "rotate-90")} aria-hidden />
        </button>

        {open ? (
          <div className="mt-3 space-y-2 border-t border-bark-100 pt-3 animate-fade-up">
            <p className="text-[10.5px] font-bold tracking-wide text-bark-500 uppercase">
              {ROLE_LABEL[recommendation.family.role]} · kebutuhan hara {NUTRIENT_LABEL[recommendation.crop.nutrientDemand]}
            </p>
            {recommendation.reasons.map((reason) => (
              <p key={reason} className="flex gap-2 text-[12.5px] leading-relaxed text-bark-700">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-leaf-600" aria-hidden />
                {reason}
              </p>
            ))}
            {recommendation.warnings.map((warning) => (
              <p key={warning} className="flex gap-2 text-[12.5px] leading-relaxed text-clay-700">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-clay-500" aria-hidden />
                {warning}
              </p>
            ))}
            {recommendation.crop.description ? (
              <p className="flex gap-2 text-[12px] leading-relaxed text-bark-500">
                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                {recommendation.crop.description}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="border-t border-bark-100 bg-bark-50/60 px-4 py-3">
        <button type="button" className="btn-primary w-full px-3 py-2 text-xs" onClick={() => onPlant(recommendation.crop)}>
          <Sprout className="size-3.5" aria-hidden />
          Rencanakan tanam {recommendation.crop.commonName}
        </button>
      </div>
    </article>
  );
}

export function RotationEngine({
  analysis,
  onPlant,
  plannedOn,
  onPlannedOnChange,
}: {
  analysis: RotationAnalysis;
  onPlant: (crop: Crop) => void;
  plannedOn: string;
  onPlannedOnChange: (value: string) => void;
}) {
  const { recommendations, avoid, alerts, cyclePlan, lastFamily, lastPlanting } = analysis;

  if (!recommendations.length && !avoid.length) {
    return (
      <EmptyState
        icon={Recycle}
        title="Katalog tanaman belum tersedia"
        description="Muat ulang halaman agar data referensi tanaman dapat diambil dari basis data."
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Ringkasan musim */}
      <div className="card-pad relative overflow-hidden">
        <div className="pointer-events-none absolute -top-16 -right-10 size-52 rounded-full bg-leaf-100/60 blur-2xl" aria-hidden />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] text-leaf-700 uppercase">
              <Recycle className="size-3.5" aria-hidden />
              Mesin rotasi
            </p>
            <h3 className="mt-1.5 font-display text-lg font-extrabold text-bark-900">
              {lastPlanting ? `Musim sebelumnya: ${lastPlanting.crop?.commonName}` : "Belum ada musim sebelumnya"}
            </h3>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {lastFamily ? <FamilyTag family={lastFamily} /> : null}
              {lastPlanting ? (
                <span className="chip bg-bark-100 text-bark-600 ring-bark-200">
                  Tanam {formatTanggalSingkat(lastPlanting.plantedOn)} ·{" "}
                  {lastPlanting.harvestedOn ? `panen ${formatTanggalSingkat(lastPlanting.harvestedOn)}` : "masih tumbuh"}
                </span>
              ) : null}
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-bark-600">{analysis.summary}</p>
          </div>
          <label className="shrink-0 rounded-2xl bg-bark-50 p-3.5 ring-1 ring-bark-200">
            <span className="label mb-1.5">Rencanakan untuk tanggal</span>
            <input
              type="date"
              className="field w-[13.5rem]"
              value={plannedOn}
              onChange={(event) => onPlannedOnChange(event.target.value || todayISO())}
            />
            <span className="mt-2 block text-[11px] leading-relaxed text-bark-500">
              Skor dihitung ulang mengikuti riwayat yang sudah terjadi sebelum tanggal ini.
            </span>
          </label>
        </div>
      </div>

      {/* Peringatan */}
      {alerts.length > 0 ? (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <AlertCard key={alert.title} alert={alert} />
          ))}
        </div>
      ) : null}

      {/* Rencana siklus 4 musim */}
      {cyclePlan.length > 0 ? (
        <div className="card-pad">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h4 className="flex items-center gap-2 font-display text-base font-extrabold text-bark-900">
                <Sparkles className="size-4 text-leaf-600" aria-hidden />
                Rencana siklus 4 musim ke depan
              </h4>
              <p className="mt-1 text-[12.5px] text-bark-600">
                Urutan famili yang disarankan agar setiap keluarga mendapat jeda minimal 3 musim.
              </p>
            </div>
            <span className="chip bg-bark-100 text-bark-600 ring-bark-200">Mulai {formatTanggal(plannedOn)}</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {cyclePlan.map((step) => (
              <div
                key={`${step.season}-${step.family.id}`}
                className="relative overflow-hidden rounded-2xl border border-bark-200 bg-bark-50/50 p-4"
              >
                <span className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: step.family.color }} aria-hidden />
                <p className="text-[10.5px] font-bold tracking-[0.14em] text-bark-500 uppercase">Musim {step.season}</p>
                <p className="mt-1 font-display text-sm font-extrabold text-bark-900">{step.label}</p>
                <div className="mt-2.5">
                  <FamilyTag family={step.family} compact />
                </div>
                <p className="mt-2.5 text-[12.5px] font-bold text-leaf-800">
                  {step.suggestedCrop ? `Contoh: ${step.suggestedCrop.commonName}` : "Pilih tanaman dari famili ini"}
                </p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-bark-600">{step.reason}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Rekomendasi */}
      <div>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h4 className="font-display text-base font-extrabold text-bark-900">
              Tanaman yang disarankan ({recommendations.length})
            </h4>
            <p className="mt-1 text-[12.5px] text-bark-600">
              Diurutkan dari skor rotasi tertinggi — gabungan jeda famili, kebutuhan hara, hasil uji tanah, dan riwayat hama.
            </p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {recommendations.map((recommendation, index) => (
            <RecommendationCard key={recommendation.crop.id} recommendation={recommendation} rank={index + 1} onPlant={onPlant} />
          ))}
        </div>
      </div>

      {/* Yang harus dihindari */}
      {avoid.length > 0 ? (
        <div className="rounded-2xl border border-clay-200 bg-clay-50/60 p-5">
          <h4 className="flex items-center gap-2 font-display text-base font-extrabold text-clay-900">
            <Ban className="size-4 text-clay-600" aria-hidden />
            Hindari musim ini
          </h4>
          <p className="mt-1 text-[12.5px] leading-relaxed text-clay-800/80">
            Tanaman berikut satu famili dengan musim sebelumnya atau baru dipakai dalam {analysis.cyclePlan.length > 0 ? "1–2" : "beberapa"} musim
            terakhir, sehingga risiko hama dan penipisan hara meningkat.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {avoid.map((item) => (
              <li key={item.crop.id} className="flex items-start justify-between gap-3 rounded-xl bg-white/80 p-3 ring-1 ring-clay-200">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-bark-900">{item.crop.commonName}</p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-clay-700">{item.warnings[0]}</p>
                </div>
                <span className="shrink-0 font-display text-sm font-extrabold text-clay-600 tabular-nums">{item.score}</span>
              </li>
            ))}
          </ul>
          {metaHint(lastFamily) ? (
            <p className="mt-3 text-[11.5px] text-clay-800/80">{metaHint(lastFamily)}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function metaHint(lastFamily: RotationAnalysis["lastFamily"]): string | null {
  if (!lastFamily) return null;
  return `Semua tanaman di daftar ini berasal dari famili ${lastFamily.name} (${lastFamily.label}). Beri jeda minimal 3 musim sebelum famili ini kembali ditanam di petak yang sama.`;
}
