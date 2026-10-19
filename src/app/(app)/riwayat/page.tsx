"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarCheck2,
  Filter,
  NotebookPen,
  Search,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { ConfirmModal } from "@/components/confirm-modal";
import { DemandTag, EmptyState, ErrorState, FamilyTag, SegmentedControl, SkeletonCard, StatCard } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useCatalog, useFarms, usePlantings, usePlantingMutations } from "@/lib/hooks";
import { hasPestSignal } from "@/lib/rotation";
import type { Planting } from "@/lib/types";
import { classNames, daysBetween, formatTanggal, formatTanggalSingkat, todayISO } from "@/lib/utils";

type StatusFilter = "semua" | "aktif" | "selesai" | "hama";

export default function RiwayatPage() {
  const { push } = useToast();
  const { data: plantings, isLoading, isError, error, refetch } = usePlantings();
  const { data: farms } = useFarms();
  const { data: catalog } = useCatalog();
  const { update, remove } = usePlantingMutations();

  const [search, setSearch] = useState("");
  const [farmFilter, setFarmFilter] = useState("semua");
  const [familyFilter, setFamilyFilter] = useState("semua");
  const [status, setStatus] = useState<StatusFilter>("semua");
  const [target, setTarget] = useState<Planting | null>(null);

  const today = todayISO();
  const all = useMemo(() => plantings ?? [], [plantings]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return all.filter((planting) => {
      if (farmFilter !== "semua" && planting.plot?.farmId !== farmFilter) return false;
      if (familyFilter !== "semua" && planting.family?.id !== familyFilter) return false;
      const isActive = !planting.harvestedOn && planting.plantedOn <= today;
      if (status === "aktif" && !isActive) return false;
      if (status === "selesai" && isActive) return false;
      if (status === "hama" && !hasPestSignal(planting)) return false;
      if (!keyword) return true;
      return (
        (planting.crop?.commonName.toLowerCase().includes(keyword) ?? false) ||
        (planting.plotName?.toLowerCase().includes(keyword) ?? false) ||
        (planting.notes?.toLowerCase().includes(keyword) ?? false) ||
        (planting.family?.name.toLowerCase().includes(keyword) ?? false)
      );
    });
  }, [all, search, farmFilter, familyFilter, status, today]);

  const stats = useMemo(() => {
    const active = all.filter((item) => !item.harvestedOn && item.plantedOn <= today).length;
    const pest = all.filter(hasPestSignal).length;
    const harvested = all.filter((item) => item.harvestedOn).length;
    return { total: all.length, active, pest, harvested };
  }, [all, today]);

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
        eyebrow="Jurnal kebun"
        title="Riwayat Tanam"
        description="Semua catatan penanaman dari seluruh petak. Riwayat inilah yang dibaca mesin rotasi untuk menentukan famili mana yang boleh ditanam berikutnya."
        actions={
          <Link href="/kebun" className="btn-primary">
            <ArrowUpRight className="size-4" aria-hidden />
            Kelola petak
          </Link>
        }
      />

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total catatan" value={stats.total} hint="Seluruh musim tanam tercatat" icon={NotebookPen} />
        <StatCard label="Sedang tumbuh" value={stats.active} hint="Belum ditandai panen" icon={CalendarCheck2} tone="clay" />
        <StatCard label="Sudah dipanen" value={stats.harvested} hint="Menjadi dasar perhitungan jeda famili" icon={CalendarCheck2} tone="bark" />
        <StatCard label="Tercatat hama" value={stats.pest} hint="Famili ini dihindari minimal 3 musim" icon={AlertTriangle} tone="harvest" />
      </section>

      <div className="card-pad mb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-bark-400" aria-hidden />
            <input
              className="field pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari tanaman, petak, famili, atau isi catatan…"
              aria-label="Cari riwayat tanam"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="label">Kebun</span>
              <select className="field" value={farmFilter} onChange={(event) => setFarmFilter(event.target.value)}>
                <option value="semua">Semua kebun</option>
                {(farms ?? []).map((farm) => (
                  <option key={farm.id} value={farm.id}>
                    {farm.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">Famili</span>
              <select className="field" value={familyFilter} onChange={(event) => setFamilyFilter(event.target.value)}>
                <option value="semua">Semua famili</option>
                {(catalog?.families ?? []).map((family) => (
                  <option key={family.id} value={family.id}>
                    {family.name} · {family.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <SegmentedControl<StatusFilter>
            size="sm"
            value={status}
            onChange={setStatus}
            options={[
              { value: "semua", label: "Semua", icon: Filter },
              { value: "aktif", label: "Sedang tumbuh" },
              { value: "selesai", label: "Sudah panen" },
              { value: "hama", label: "Ada hama", icon: AlertTriangle },
            ]}
          />
          <p className="text-[11.5px] text-bark-500">
            Menampilkan {filtered.length} dari {all.length} catatan
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title={all.length === 0 ? "Belum ada riwayat tanam" : "Tidak ada catatan yang cocok"}
          description={
            all.length === 0
              ? "Catat penanaman pertama Anda dari halaman Kebun & Petak agar mesin rotasi mulai bekerja."
              : "Ubah kata kunci atau filter untuk melihat catatan lainnya."
          }
          action={
            all.length === 0 ? (
              <Link href="/kebun" className="btn-primary">
                Ke Kebun & Petak
              </Link>
            ) : (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setSearch("");
                  setFarmFilter("semua");
                  setFamilyFilter("semua");
                  setStatus("semua");
                }}
              >
                Reset filter
              </button>
            )
          }
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((planting) => {
            const isActive = !planting.harvestedOn && planting.plantedOn <= today;
            const pest = hasPestSignal(planting);
            const elapsed = daysBetween(planting.plantedOn, planting.harvestedOn ?? today);
            return (
              <li
                key={planting.id}
                className="card overflow-hidden transition hover:border-leaf-300 hover:shadow-lift"
                style={{ borderLeft: `3px solid ${planting.family?.color ?? "#d5dbd3"}` }}
              >
                <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center">
                  <div className="min-w-0 flex-1">
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
                          Hama tercatat
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {planting.family ? <FamilyTag family={planting.family} /> : null}
                      {planting.crop ? <DemandTag demand={planting.crop.nutrientDemand} /> : null}
                    </div>
                    <Link
                      href={`/petak/${planting.plotId}`}
                      className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-bold text-leaf-700 transition hover:text-leaf-800"
                    >
                      {planting.plotName}
                      {planting.plot?.farmName ? ` · ${planting.plot.farmName}` : ""}
                      <ArrowUpRight className="size-3" aria-hidden />
                    </Link>
                    {planting.notes ? (
                      <p
                        className={classNames(
                          "mt-2.5 rounded-xl border p-2.5 text-[12px] leading-relaxed",
                          pest ? "border-clay-200 bg-clay-50 text-clay-800" : "border-bark-200 bg-bark-50 text-bark-600",
                        )}
                      >
                        {planting.notes}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid shrink-0 grid-cols-3 gap-3 lg:w-[22rem]">
                    <div className="rounded-xl bg-bark-50 p-2.5 text-center">
                      <p className="text-[10px] font-bold tracking-wide text-bark-500 uppercase">Tanam</p>
                      <p className="mt-1 text-[12px] font-bold text-bark-900">{formatTanggalSingkat(planting.plantedOn)}</p>
                    </div>
                    <div className="rounded-xl bg-bark-50 p-2.5 text-center">
                      <p className="text-[10px] font-bold tracking-wide text-bark-500 uppercase">Panen</p>
                      <p className="mt-1 text-[12px] font-bold text-bark-900">
                        {planting.harvestedOn ? formatTanggalSingkat(planting.harvestedOn) : "—"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-bark-50 p-2.5 text-center">
                      <p className="text-[10px] font-bold tracking-wide text-bark-500 uppercase">Durasi</p>
                      <p className="mt-1 text-[12px] font-bold text-bark-900">{elapsed} hari</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 lg:flex-col">
                    {isActive ? (
                      <button
                        type="button"
                        className="btn-secondary w-full px-3 py-2 text-xs"
                        disabled={update.isPending}
                        onClick={() =>
                          update.mutate(
                            { id: planting.id, harvestedOn: today },
                            {
                              onSuccess: () =>
                                push({
                                  kind: "sukses",
                                  title: "Panen tercatat",
                                  detail: `${planting.crop?.commonName} di ${planting.plotName} · ${formatTanggal(today)}`,
                                }),
                              onError: (err) => push({ kind: "error", title: "Gagal memperbarui", detail: err.message }),
                            },
                          )
                        }
                      >
                        <CalendarCheck2 className="size-3.5" aria-hidden />
                        Tandai panen
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="btn-ghost w-full px-3 py-2 text-xs hover:bg-clay-50 hover:text-clay-600"
                      onClick={() => setTarget(planting)}
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      Hapus
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmModal
        open={Boolean(target)}
        title="Hapus catatan tanam?"
        description={
          target
            ? `Catatan ${target.crop?.commonName} (${formatTanggal(target.plantedOn)}) di ${target.plotName} akan dihapus dan tidak lagi dihitung dalam perhitungan rotasi.`
            : ""
        }
        pending={remove.isPending}
        onConfirm={() => {
          if (!target) return;
          remove.mutate(target.id, {
            onSuccess: () => {
              push({ kind: "sukses", title: "Catatan tanam dihapus" });
              setTarget(null);
            },
            onError: (err) => push({ kind: "error", title: "Gagal menghapus", detail: err.message }),
          });
        }}
        onClose={() => setTarget(null)}
      />
    </>
  );
}
