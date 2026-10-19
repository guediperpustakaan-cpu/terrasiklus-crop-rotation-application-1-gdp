"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CalendarClock,
  Droplets,
  FlaskConical,
  Pencil,
  Ruler,
  Sprout,
  Trash2,
} from "lucide-react";
import { FamilyTag, Progress, VerdictTag } from "@/components/ui";
import { NUTRIENT_LABEL } from "@/lib/rotation";
import type { Plot, PlotSummary } from "@/lib/types";
import { classNames, daysBetween, formatTanggal, formatTanggalSingkat, soilTypeLabel, todayISO } from "@/lib/utils";

export function PlotCard({
  summary,
  onEdit,
  onDelete,
  onPlant,
  onSoil,
}: {
  summary: PlotSummary;
  onEdit: (plot: Plot) => void;
  onDelete: (plot: Plot) => void;
  onPlant: (plot: Plot) => void;
  onSoil: (plot: Plot) => void;
}) {
  const { plot, activePlanting, latestSoilTest, soilReport, topRecommendation, lastPlanting } = summary;
  const today = todayISO();

  const growth = activePlanting
    ? Math.min(
        100,
        Math.round(
          (daysBetween(activePlanting.plantedOn, today) / Math.max(1, activePlanting.crop?.harvestDays ?? 70)) * 100,
        ),
      )
    : 0;

  return (
    <article className="group card relative flex flex-col overflow-hidden transition duration-200 hover:-translate-y-1 hover:border-leaf-300 hover:shadow-lift">
      <span
        className="absolute inset-x-0 top-0 h-1"
        style={{
          background: activePlanting?.family
            ? `linear-gradient(90deg, ${activePlanting.family.color}, ${activePlanting.family.color}55)`
            : "linear-gradient(90deg, var(--color-bark-200), transparent)",
        }}
        aria-hidden
      />

      <header className="flex items-start justify-between gap-3 px-5 pt-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display text-base font-extrabold text-bark-900">{plot.name}</h3>
            <span
              className={classNames(
                "chip shrink-0",
                activePlanting ? "bg-leaf-100 text-leaf-800 ring-leaf-200" : "bg-bark-100 text-bark-600 ring-bark-200",
              )}
            >
              {activePlanting ? "Sedang ditanami" : "Kosong"}
            </span>
          </div>
          <p className="mt-1 truncate text-xs text-bark-500">{plot.farmName}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
          <button
            type="button"
            onClick={() => onEdit(plot)}
            className="rounded-lg p-1.5 text-bark-400 transition hover:bg-bark-100 hover:text-bark-800"
            aria-label={`Ubah ${plot.name}`}
          >
            <Pencil className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => onDelete(plot)}
            className="rounded-lg p-1.5 text-bark-400 transition hover:bg-clay-50 hover:text-clay-600"
            aria-label={`Hapus ${plot.name}`}
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-5 pt-3 text-[11.5px] font-medium text-bark-500">
        <span className="inline-flex items-center gap-1.5">
          <Ruler className="size-3.5 text-bark-400" aria-hidden />
          {plot.area.toLocaleString("id-ID")} m²
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Droplets className="size-3.5 text-bark-400" aria-hidden />
          {soilTypeLabel(plot.soilType)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarClock className="size-3.5 text-bark-400" aria-hidden />
          {summary.plantingCount} catatan tanam
        </span>
      </div>

      <div className="mt-4 flex-1 px-5">
        {activePlanting ? (
          <div className="rounded-2xl bg-leaf-50/70 p-4 ring-1 ring-leaf-100">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[10.5px] font-bold tracking-wide text-leaf-700 uppercase">
                  <Sprout className="size-3.5" aria-hidden />
                  Tanaman aktif
                </p>
                <p className="mt-1 truncate font-display text-[15px] font-extrabold text-bark-900">
                  {activePlanting.crop?.commonName}
                </p>
              </div>
              {activePlanting.family ? <FamilyTag family={activePlanting.family} compact /> : null}
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] font-semibold text-bark-600">
                <span>Tanam {formatTanggalSingkat(activePlanting.plantedOn)}</span>
                <span>{growth}%</span>
              </div>
              <Progress value={growth} className="mt-1.5" barClassName="bg-leaf-600" />
              <p className="mt-2 text-[11.5px] text-leaf-800">
                Perkiraan panen <span className="font-bold">{formatTanggalSingkat(activePlanting.estimatedHarvestOn ?? null)}</span>{" "}
                · {summary.harvestLabel}
              </p>
            </div>
          </div>
        ) : topRecommendation ? (
          <div className="rounded-2xl border border-dashed border-bark-300 bg-bark-50/60 p-4">
            <p className="flex items-center gap-1.5 text-[10.5px] font-bold tracking-wide text-bark-500 uppercase">
              <Sprout className="size-3.5" aria-hidden />
              Petak kosong · saran rotasi
            </p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="truncate font-display text-[15px] font-extrabold text-bark-900">
                {topRecommendation.crop.commonName}
              </p>
              <VerdictTag verdict={topRecommendation.verdict} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <FamilyTag family={topRecommendation.family} />
              <span className="chip bg-bark-100 text-bark-600 ring-bark-200">
                Hara {NUTRIENT_LABEL[topRecommendation.crop.nutrientDemand]}
              </span>
            </div>
            <p className="mt-2.5 text-[11.5px] leading-relaxed text-bark-600">
              {topRecommendation.reasons[0] ?? "Famili berbeda dari musim sebelumnya untuk memutus siklus hama."}
            </p>
            {lastPlanting ? (
              <p className="mt-2 text-[11px] text-bark-500">
                Musim lalu: <span className="font-semibold text-bark-700">{lastPlanting.crop?.commonName}</span> (
                {lastPlanting.family?.name}) · panen {formatTanggalSingkat(lastPlanting.harvestedOn ?? lastPlanting.plantedOn)}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-4 px-5">
        <div className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-bark-200">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-clay-50 text-clay-700 ring-1 ring-clay-100">
            <FlaskConical className="size-4.5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            {soilReport && latestSoilTest ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold tracking-wide text-bark-500 uppercase">Kesehatan tanah</p>
                  <p className="text-[11px] font-semibold text-bark-500">{formatTanggalSingkat(latestSoilTest.testedOn)}</p>
                </div>
                <p className="mt-0.5 truncate text-sm font-extrabold text-bark-900">
                  {soilReport.score}
                  <span className="text-bark-400">/100</span>{" "}
                  <span className="ml-1 text-xs font-semibold text-leaf-700">{soilReport.grade}</span>
                </p>
                <p className="mt-0.5 text-[11px] text-bark-500">
                  pH {latestSoilTest.ph.toFixed(1)} · N {latestSoilTest.n} · P {latestSoilTest.p} · K {latestSoilTest.k} ppm ·{" "}
                  {latestSoilTest.organicMatter}% C-org
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-bark-800">Belum ada uji tanah</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-bark-500">
                  Rekomendasi rotasi belum memperhitungkan kondisi hara petak ini.
                </p>
              </>
            )}
          </div>
          <button type="button" onClick={() => onSoil(plot)} className="btn-secondary shrink-0 px-3 py-2 text-xs">
            {soilReport ? "Perbarui" : "Isi"}
          </button>
        </div>
      </div>

      <footer className="mt-4 flex items-center gap-2 border-t border-bark-100 bg-bark-50/60 px-5 py-3.5">
        <button type="button" onClick={() => onPlant(plot)} className="btn-primary flex-1 px-3 py-2 text-xs">
          <Sprout className="size-3.5" aria-hidden />
          Catat tanam
        </button>
        <Link href={`/petak/${plot.id}`} className="btn-secondary flex-1 px-3 py-2 text-xs">
          Detail & rotasi
          <ArrowUpRight className="size-3.5" aria-hidden />
        </Link>
      </footer>
    </article>
  );
}

export function PlotCardSkeleton() {
  return (
    <div className="card space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="skeleton h-4 w-40" />
          <div className="skeleton h-3 w-24" />
        </div>
        <div className="skeleton h-6 w-20 rounded-full" />
      </div>
      <div className="skeleton h-24 w-full" />
      <div className="skeleton h-16 w-full" />
      <div className="skeleton h-9 w-full" />
    </div>
  );
}

export function formatTanggalLengkap(value: string | null): string {
  return formatTanggal(value);
}
