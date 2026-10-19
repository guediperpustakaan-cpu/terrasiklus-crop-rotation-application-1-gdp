"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarCheck2,
  CalendarClock,
  Droplets,
  FlaskConical,
  History,
  NotebookPen,
  Pencil,
  Ruler,
  Sprout,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { ConfirmModal } from "@/components/confirm-modal";
import { PlotFormModal } from "@/components/forms";
import { PlantingFormModal } from "@/components/planting-form";
import { RotationEngine } from "@/components/rotation-engine";
import { SoilFormModal, SoilHealthPanel } from "@/components/soil-form";
import { Callout, DemandTag, EmptyState, ErrorState, FamilyTag, Progress, SegmentedControl, Spinner, StatCard } from "@/components/ui";
import { useToast } from "@/components/toast";
import { api } from "@/lib/api-client";
import { usePlantingMutations, useSoilTestMutations } from "@/lib/hooks";
import { hasPestSignal, NUTRIENT_LABEL } from "@/lib/rotation";
import { buildSoilReport } from "@/lib/soil";
import type { Crop, Planting, SoilTest } from "@/lib/types";
import { classNames, daysBetween, formatTanggal, formatTanggalSingkat, soilTypeLabel, todayISO } from "@/lib/utils";

type Tab = "rotasi" | "riwayat" | "tanah";

export default function PlotDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const plotId = params?.id ?? "";
  const { push } = useToast();
  const plantingMutations = usePlantingMutations();
  const soilMutations = useSoilTestMutations();

  const [tab, setTab] = useState<Tab>("rotasi");
  const [plannedOn, setPlannedOn] = useState(todayISO());
  const [plantingModal, setPlantingModal] = useState<{ open: boolean; crop: Crop | null }>({ open: false, crop: null });
  const [soilModal, setSoilModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [confirm, setConfirm] = useState<
    | { open: false }
    | { open: true; kind: "plot" }
    | { open: true; kind: "planting"; target: Planting }
    | { open: true; kind: "soil"; target: SoilTest }
  >({ open: false });

  const detailQuery = useQuery({
    queryKey: ["plot-detail", plotId, plannedOn],
    queryFn: () => api.plots.detail(plotId, plannedOn),
    enabled: Boolean(plotId),
  });

  const detail = detailQuery.data;
  const today = todayISO();

  if (detailQuery.isError) {
    return (
      <div className="py-10">
        <ErrorState message={detailQuery.error.message} onRetry={() => void detailQuery.refetch()} />
        <Link href="/kebun" className="btn-secondary mt-4">
          <ArrowLeft className="size-4" aria-hidden />
          Kembali ke daftar petak
        </Link>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="py-16">
        <Spinner label="Memuat detail petak…" />
      </div>
    );
  }

  const { plot, farm, history, soilTests, analysis } = detail;
  const activePlantings = history.filter((item) => !item.harvestedOn && item.plantedOn <= today);
  const pestCount = history.filter(hasPestSignal).length;
  const distinctFamilies = new Set(history.map((item) => item.family?.id).filter(Boolean)).size;

  function markHarvested(planting: Planting) {
    plantingMutations.update.mutate(
      { id: planting.id, harvestedOn: today },
      {
        onSuccess: () =>
          push({
            kind: "sukses",
            title: "Panen tercatat",
            detail: `${planting.crop?.commonName} di ${plot.name} ditandai panen hari ini.`,
          }),
        onError: (err) => push({ kind: "error", title: "Gagal memperbarui", detail: err.message }),
      },
    );
  }

  function runConfirm() {
    if (!confirm.open) return;
    if (confirm.kind === "plot") {
      api.plots
        .remove(plotId)
        .then(() => {
          push({ kind: "sukses", title: "Petak dihapus", detail: plot.name });
          router.push("/kebun");
        })
        .catch((err: Error) => push({ kind: "error", title: "Gagal menghapus petak", detail: err.message }));
      return;
    }
    if (confirm.kind === "planting") {
      plantingMutations.remove.mutate(confirm.target.id, {
        onSuccess: () => {
          push({ kind: "sukses", title: "Catatan tanam dihapus" });
          void detailQuery.refetch();
          setConfirm({ open: false });
        },
        onError: (err) => push({ kind: "error", title: "Gagal menghapus", detail: err.message }),
      });
      return;
    }
    soilMutations.remove.mutate(confirm.target.id, {
      onSuccess: () => {
        push({ kind: "sukses", title: "Hasil uji tanah dihapus" });
        void detailQuery.refetch();
        setConfirm({ open: false });
      },
      onError: (err) => push({ kind: "error", title: "Gagal menghapus", detail: err.message }),
    });
  }

  return (
    <>
      <Link href="/kebun" className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-bark-500 transition hover:text-leaf-700">
        <ArrowLeft className="size-3.5" aria-hidden />
        Semua petak
      </Link>

      <PageHeader
        eyebrow={`${farm.name}${farm.location ? ` · ${farm.location}` : ""}`}
        title={plot.name}
        description={plot.notes ?? "Belum ada catatan khusus untuk petak ini."}
        actions={
          <>
            <button type="button" className="btn-secondary" onClick={() => setEditModal(true)}>
              <Pencil className="size-4" aria-hidden />
              Ubah petak
            </button>
            <button type="button" className="btn-secondary" onClick={() => setSoilModal(true)}>
              <FlaskConical className="size-4" aria-hidden />
              Uji tanah
            </button>
            <button type="button" className="btn-primary" onClick={() => setPlantingModal({ open: true, crop: null })}>
              <Sprout className="size-4" aria-hidden />
              Catat tanam
            </button>
            <button
              type="button"
              className="btn-ghost px-2.5 hover:bg-clay-50 hover:text-clay-600"
              onClick={() => setConfirm({ open: true, kind: "plot" })}
              aria-label="Hapus petak"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Luas petak" value={`${plot.area.toLocaleString("id-ID")} m²`} hint={soilTypeLabel(plot.soilType)} icon={Ruler} />
        <StatCard
          label="Catatan musim"
          value={history.length}
          hint={`${distinctFamilies} famili botani berbeda pernah dipakai`}
          icon={History}
          tone="bark"
        />
        <StatCard
          label="Sedang tumbuh"
          value={activePlantings.length}
          hint={activePlantings[0] ? `${activePlantings[0].crop?.commonName} · panen ${formatTanggalSingkat(activePlantings[0].estimatedHarvestOn ?? null)}` : "Petak siap ditanami"}
          icon={Sprout}
          tone="clay"
        />
        <StatCard
          label="Skor tanah"
          value={soilTests[0] ? soilScoreLabel(soilTests[0]) : "—"}
          hint={soilTests[0] ? `Uji terakhir ${formatTanggalSingkat(soilTests[0].testedOn)}` : "Belum ada uji tanah"}
          icon={FlaskConical}
          tone="harvest"
        />
      </div>

      {pestCount > 0 ? (
        <Callout level="peringatan" title={`${pestCount} musim tercatat mengalami gangguan hama/penyakit`} icon={AlertTriangle}>
          <p>
            Famili yang pernah terserang akan dikurangi skornya oleh mesin rotasi selama minimal 3 musim. Bersihkan sisa
            tanaman, dan pertimbangkan tanaman aromatik sebagai pendamping.
          </p>
        </Callout>
      ) : null}

      <div className="mt-6 mb-5 flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: "rotasi", label: "Rotasi & rekomendasi", icon: Sprout },
            { value: "riwayat", label: `Riwayat tanam (${history.length})`, icon: NotebookPen },
            { value: "tanah", label: `Kesehatan tanah (${soilTests.length})`, icon: FlaskConical },
          ]}
        />
        <span className="chip bg-white text-bark-500 ring-bark-200">
          <CalendarClock className="size-3" aria-hidden />
          Data per {formatTanggal(today)}
        </span>
      </div>

      {tab === "rotasi" ? (
        <RotationEngine
          analysis={analysis}
          plannedOn={plannedOn}
          onPlannedOnChange={setPlannedOn}
          onPlant={(crop) => setPlantingModal({ open: true, crop })}
        />
      ) : null}

      {tab === "riwayat" ? (
        <div className="space-y-4">
          {history.length === 0 ? (
            <EmptyState
              icon={NotebookPen}
              title="Belum ada riwayat tanam"
              description="Catat penanaman pertama di petak ini. Setelah ada dua musim data, mesin rotasi bisa menghitung jeda famili dengan akurat."
              action={
                <button type="button" className="btn-primary" onClick={() => setPlantingModal({ open: true, crop: null })}>
                  <Sprout className="size-4" aria-hidden />
                  Catat penanaman pertama
                </button>
              }
            />
          ) : (
            <ol className="relative space-y-3 border-l border-dashed border-bark-300 pl-6">
              {history.map((planting) => {
                const isActive = !planting.harvestedOn && planting.plantedOn <= today;
                const elapsed = daysBetween(planting.plantedOn, isActive ? today : (planting.harvestedOn ?? today));
                const total = planting.crop?.harvestDays ?? 70;
                const progress = isActive ? Math.min(100, Math.round((elapsed / Math.max(1, total)) * 100)) : 100;
                const pest = hasPestSignal(planting);
                return (
                  <li key={planting.id} className="relative">
                    <span
                      className="absolute top-6 -left-[31px] size-3.5 rounded-full ring-4 ring-paper"
                      style={{ backgroundColor: planting.family?.color ?? "#8a9489" }}
                      aria-hidden
                    />
                    <div className="card p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-display text-[15px] font-extrabold text-bark-900">
                              {planting.crop?.commonName}
                            </h3>
                            {isActive ? (
                              <span className="chip bg-leaf-100 text-leaf-800 ring-leaf-200">Sedang tumbuh</span>
                            ) : (
                              <span className="chip bg-bark-100 text-bark-600 ring-bark-200">Sudah dipanen</span>
                            )}
                            {pest ? (
                              <span className="chip bg-clay-100 text-clay-800 ring-clay-200">
                                <AlertTriangle className="size-3" aria-hidden />
                                Ada hama/penyakit
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {planting.family ? <FamilyTag family={planting.family} /> : null}
                            {planting.crop ? <DemandTag demand={planting.crop.nutrientDemand} /> : null}
                            <span className="chip bg-white text-bark-600 ring-bark-200">
                              Hara {planting.crop ? NUTRIENT_LABEL[planting.crop.nutrientDemand] : "—"}
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {isActive ? (
                            <button
                              type="button"
                              className="btn-secondary px-3 py-2 text-xs"
                              onClick={() => markHarvested(planting)}
                              disabled={plantingMutations.update.isPending}
                            >
                              <CalendarCheck2 className="size-3.5" aria-hidden />
                              Tandai panen
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="rounded-lg p-2 text-bark-400 transition hover:bg-clay-50 hover:text-clay-600"
                            onClick={() => setConfirm({ open: true, kind: "planting", target: planting })}
                            aria-label={`Hapus catatan ${planting.crop?.commonName ?? ""}`}
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl bg-bark-50 p-3">
                          <p className="text-[10.5px] font-bold tracking-wide text-bark-500 uppercase">Tanggal tanam</p>
                          <p className="mt-1 text-sm font-bold text-bark-900">{formatTanggal(planting.plantedOn)}</p>
                        </div>
                        <div className="rounded-xl bg-bark-50 p-3">
                          <p className="text-[10.5px] font-bold tracking-wide text-bark-500 uppercase">Tanggal panen</p>
                          <p className="mt-1 text-sm font-bold text-bark-900">
                            {planting.harvestedOn ? formatTanggal(planting.harvestedOn) : "—"}
                          </p>
                        </div>
                        <div className="rounded-xl bg-bark-50 p-3">
                          <p className="text-[10.5px] font-bold tracking-wide text-bark-500 uppercase">
                            {isActive ? "Perkiraan panen" : "Lama tanam"}
                          </p>
                          <p className="mt-1 text-sm font-bold text-bark-900">
                            {isActive ? formatTanggal(planting.estimatedHarvestOn ?? null) : `${elapsed} hari`}
                          </p>
                        </div>
                      </div>

                      {isActive ? (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-[11.5px] font-semibold text-bark-600">
                            <span className="inline-flex items-center gap-1.5">
                              <Droplets className="size-3.5 text-leaf-600" aria-hidden />
                              Progres pertumbuhan
                            </span>
                            <span>{progress}%</span>
                          </div>
                          <Progress value={progress} className="mt-1.5" barClassName="bg-leaf-600" />
                        </div>
                      ) : null}

                      {planting.notes ? (
                        <p
                          className={classNames(
                            "mt-3 rounded-xl border p-3 text-[12.5px] leading-relaxed",
                            pest ? "border-clay-200 bg-clay-50 text-clay-800" : "border-bark-200 bg-white text-bark-600",
                          )}
                        >
                          <span className="font-bold">Catatan: </span>
                          {planting.notes}
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      ) : null}

      {tab === "tanah" ? (
        <SoilHealthPanel
          plot={plot}
          tests={soilTests}
          onAdd={() => setSoilModal(true)}
          onDelete={(test) => setConfirm({ open: true, kind: "soil", target: test })}
        />
      ) : null}

      <PlantingFormModal
        open={plantingModal.open}
        plot={plot}
        presetCrop={plantingModal.crop}
        onClose={() => {
          setPlantingModal({ open: false, crop: null });
          void detailQuery.refetch();
        }}
      />
      <SoilFormModal
        open={soilModal}
        plot={plot}
        onClose={() => {
          setSoilModal(false);
          void detailQuery.refetch();
        }}
      />
      <PlotFormModal
        open={editModal}
        plot={plot}
        onClose={() => {
          setEditModal(false);
          void detailQuery.refetch();
        }}
      />
      <ConfirmModal
        open={confirm.open}
        title={
          !confirm.open
            ? ""
            : confirm.kind === "plot"
              ? "Hapus petak ini?"
              : confirm.kind === "planting"
                ? "Hapus catatan tanam?"
                : "Hapus hasil uji tanah?"
        }
        description={
          !confirm.open
            ? ""
            : confirm.kind === "plot"
              ? `Petak “${plot.name}” beserta seluruh riwayat tanam dan uji tanahnya akan dihapus permanen.`
              : confirm.kind === "planting"
                ? `Catatan ${confirm.target.crop?.commonName ?? ""} (${formatTanggal(confirm.target.plantedOn)}) akan dihapus dan tidak lagi dihitung dalam rotasi.`
                : `Hasil uji tanah ${formatTanggal(confirm.target.testedOn)} akan dihapus.`
        }
        pending={plantingMutations.remove.isPending || soilMutations.remove.isPending}
        onConfirm={runConfirm}
        onClose={() => setConfirm({ open: false })}
      />
    </>
  );
}

function soilScoreLabel(test: SoilTest): string {
  const report = buildSoilReport(test);
  return `${report.score}/100`;
}
