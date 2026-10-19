"use client";

import { useMemo, useState } from "react";
import {
  Layers,
  MapPin,
  Pencil,
  Plus,
  Ruler,
  Search,
  Sprout,
  Trash2,
  Trees,
} from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { ConfirmModal } from "@/components/confirm-modal";
import { FarmFormModal, PlotFormModal } from "@/components/forms";
import { PlantingFormModal } from "@/components/planting-form";
import { SoilFormModal } from "@/components/soil-form";
import { PlotCard, PlotCardSkeleton } from "@/components/plot-card";
import { EmptyState, ErrorState } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useFarms, useFarmMutations, usePlotMutations, usePlotSummaries } from "@/lib/hooks";
import type { Farm, Plot } from "@/lib/types";
import { classNames } from "@/lib/utils";

export default function KebunPage() {
  const { push } = useToast();
  const { data: farms, isLoading: farmsLoading } = useFarms();
  const { data: summaries, isLoading: summariesLoading, isError, error, refetch } = usePlotSummaries();
  const farmMutations = useFarmMutations();
  const plotMutations = usePlotMutations();

  const [farmFilter, setFarmFilter] = useState<string>("semua");
  const [search, setSearch] = useState("");

  const [farmModal, setFarmModal] = useState<{ open: boolean; farm: Farm | null }>({ open: false, farm: null });
  const [plotModal, setPlotModal] = useState<{ open: boolean; plot: Plot | null; farmId?: string }>({
    open: false,
    plot: null,
  });
  const [plantingModal, setPlantingModal] = useState<{ open: boolean; plot: Plot | null }>({ open: false, plot: null });
  const [soilModal, setSoilModal] = useState<{ open: boolean; plot: Plot | null }>({ open: false, plot: null });
  const [confirm, setConfirm] = useState<{ open: boolean; kind: "farm" | "plot"; target: Farm | Plot | null }>({
    open: false,
    kind: "plot",
    target: null,
  });

  const plots = useMemo(() => summaries ?? [], [summaries]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return plots.filter((summary) => {
      if (farmFilter !== "semua" && summary.plot.farmId !== farmFilter) return false;
      if (!keyword) return true;
      return (
        summary.plot.name.toLowerCase().includes(keyword) ||
        (summary.plot.farmName ?? "").toLowerCase().includes(keyword) ||
        (summary.activePlanting?.crop?.commonName.toLowerCase().includes(keyword) ?? false) ||
        summary.plot.soilType.includes(keyword)
      );
    });
  }, [plots, farmFilter, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, { farm: Farm | undefined; items: typeof filtered }>();
    for (const summary of filtered) {
      const farm = farms?.find((item) => item.id === summary.plot.farmId);
      const entry = map.get(summary.plot.farmId) ?? { farm, items: [] };
      entry.items.push(summary);
      map.set(summary.plot.farmId, entry);
    }
    return Array.from(map.values());
  }, [filtered, farms]);

  function runConfirm() {
    if (!confirm.target) return;
    if (confirm.kind === "farm") {
      farmMutations.remove.mutate(confirm.target.id, {
        onSuccess: () => {
          push({ kind: "sukses", title: "Kebun dihapus", detail: `${confirm.target?.name} beserta petaknya dihapus.` });
          setConfirm({ open: false, kind: "farm", target: null });
        },
        onError: (err) => push({ kind: "error", title: "Gagal menghapus kebun", detail: err.message }),
      });
    } else {
      plotMutations.remove.mutate(confirm.target.id, {
        onSuccess: () => {
          push({ kind: "sukses", title: "Petak dihapus", detail: `${confirm.target?.name} dihapus dari kebun.` });
          setConfirm({ open: false, kind: "plot", target: null });
        },
        onError: (err) => push({ kind: "error", title: "Gagal menghapus petak", detail: err.message }),
      });
    }
  }

  const totalArea = filtered.reduce((sum, item) => sum + item.plot.area, 0);

  if (isError) {
    return (
      <div className="py-10">
        <ErrorState message={error.message} onRetry={() => void refetch()} />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Manajemen lahan"
        title="Kebun & Petak"
        description="Kelola kebun sebagai wadah, lalu pecah menjadi petak dengan luas dan tipe tanah masing-masing. Setiap petak punya riwayat rotasinya sendiri."
        actions={
          <>
            <button type="button" className="btn-secondary" onClick={() => setFarmModal({ open: true, farm: null })}>
              <Plus className="size-4" aria-hidden />
              Kebun baru
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setPlotModal({ open: true, plot: null, farmId: farms?.[0]?.id })}
              disabled={!farms?.length}
            >
              <Sprout className="size-4" aria-hidden />
              Petak baru
            </button>
          </>
        }
      />

      {/* Filter */}
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFarmFilter("semua")}
            className={classNames(
              "chip transition",
              farmFilter === "semua" ? "bg-leaf-700 text-white ring-leaf-700" : "bg-white text-bark-600 ring-bark-200 hover:ring-leaf-300",
            )}
          >
            <Layers className="size-3" aria-hidden />
            Semua ({plots.length})
          </button>
          {(farms ?? []).map((farm) => (
            <button
              key={farm.id}
              type="button"
              onClick={() => setFarmFilter(farm.id)}
              className={classNames(
                "chip transition",
                farmFilter === farm.id ? "bg-leaf-700 text-white ring-leaf-700" : "bg-white text-bark-600 ring-bark-200 hover:ring-leaf-300",
              )}
            >
              {farm.name} ({plots.filter((item) => item.plot.farmId === farm.id).length})
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-bark-400" aria-hidden />
          <input
            className="field pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari petak, tanaman, atau tipe tanah…"
            aria-label="Cari petak"
          />
        </div>
      </div>

      {farmsLoading || summariesLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <PlotCardSkeleton key={index} />
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <EmptyState
          icon={Trees}
          title={plots.length === 0 ? "Belum ada petak" : "Tidak ada hasil yang cocok"}
          description={
            plots.length === 0
              ? "Mulai dengan membuat kebun, lalu tambahkan petak di dalamnya. TerraSiklus sudah menyediakan kebun contoh bila basis data masih baru."
              : "Coba ubah kata kunci pencarian atau pilih kebun lain."
          }
          action={
            plots.length === 0 ? (
              <button type="button" className="btn-primary" onClick={() => setFarmModal({ open: true, farm: null })}>
                <Plus className="size-4" aria-hidden />
                Buat kebun pertama
              </button>
            ) : (
              <button type="button" className="btn-secondary" onClick={() => { setSearch(""); setFarmFilter("semua"); }}>
                Reset filter
              </button>
            )
          }
        />
      ) : (
        <div className="space-y-8">
          {grouped.map(({ farm, items }) => (
            <section key={farm?.id ?? "tanpa-kebun"}>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-bark-200/70 bg-white px-5 py-4 shadow-soft">
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-bark-900">
                    <Trees className="size-4.5 text-leaf-700" aria-hidden />
                    {farm?.name ?? "Kebun tanpa nama"}
                  </h2>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-bark-500">
                    {farm?.location ? (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="size-3.5" aria-hidden />
                        {farm.location}
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1.5">
                      <Layers className="size-3.5" aria-hidden />
                      {items.length} petak ditampilkan
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Ruler className="size-3.5" aria-hidden />
                      {totalArea.toLocaleString("id-ID")} m² (semua filter)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn-secondary px-3 py-2 text-xs"
                    onClick={() => setPlotModal({ open: true, plot: null, farmId: farm?.id })}
                  >
                    <Plus className="size-3.5" aria-hidden />
                    Petak
                  </button>
                  <button
                    type="button"
                    className="btn-ghost px-2.5 py-2 text-xs"
                    onClick={() => farm && setFarmModal({ open: true, farm })}
                    aria-label={`Ubah ${farm?.name ?? "kebun"}`}
                  >
                    <Pencil className="size-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="btn-ghost px-2.5 py-2 text-xs hover:bg-clay-50 hover:text-clay-600"
                    onClick={() => farm && setConfirm({ open: true, kind: "farm", target: farm })}
                    aria-label={`Hapus ${farm?.name ?? "kebun"}`}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {items.map((summary) => (
                  <PlotCard
                    key={summary.plot.id}
                    summary={summary}
                    onEdit={(plot) => setPlotModal({ open: true, plot, farmId: plot.farmId })}
                    onDelete={(plot) => setConfirm({ open: true, kind: "plot", target: plot })}
                    onPlant={(plot) => setPlantingModal({ open: true, plot })}
                    onSoil={(plot) => setSoilModal({ open: true, plot })}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <FarmFormModal
        open={farmModal.open}
        farm={farmModal.farm}
        onClose={() => setFarmModal({ open: false, farm: null })}
      />
      <PlotFormModal
        open={plotModal.open}
        plot={plotModal.plot}
        defaultFarmId={plotModal.farmId}
        onClose={() => setPlotModal({ open: false, plot: null })}
      />
      <PlantingFormModal
        open={plantingModal.open}
        plot={plantingModal.plot}
        onClose={() => setPlantingModal({ open: false, plot: null })}
      />
      <SoilFormModal
        open={soilModal.open}
        plot={soilModal.plot}
        onClose={() => setSoilModal({ open: false, plot: null })}
      />
      <ConfirmModal
        open={confirm.open}
        title={confirm.kind === "farm" ? "Hapus kebun ini?" : "Hapus petak ini?"}
        description={
          confirm.kind === "farm"
            ? `Kebun “${(confirm.target as Farm)?.name}” beserta seluruh petak, riwayat tanam, dan hasil uji tanah di dalamnya akan dihapus permanen.`
            : `Petak “${(confirm.target as Plot)?.name}” beserta riwayat tanam dan uji tanahnya akan dihapus permanen.`
        }
        pending={farmMutations.remove.isPending || plotMutations.remove.isPending}
        onConfirm={runConfirm}
        onClose={() => setConfirm({ open: false, kind: confirm.kind, target: null })}
      />
    </>
  );
}
