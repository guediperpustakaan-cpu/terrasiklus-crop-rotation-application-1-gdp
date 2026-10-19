"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Leaf, MapPin, Search, Sprout } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { PlantingFormModal } from "@/components/planting-form";
import { DemandTag, EmptyState, ErrorState, Field, Modal, SegmentedControl, Spinner, StatCard } from "@/components/ui";
import { useCatalog, usePlots } from "@/lib/hooks";
import { ROLE_LABEL } from "@/lib/rotation";
import type { Crop, NutrientDemand, Plot } from "@/lib/types";
import { classNames } from "@/lib/utils";

type DemandFilter = "semua" | NutrientDemand;

export default function KatalogPage() {
  const { data: catalog, isLoading, isError, error, refetch } = useCatalog();
  const { data: plots } = usePlots();
  const [search, setSearch] = useState("");
  const [familyFilter, setFamilyFilter] = useState<string>("semua");
  const [demandFilter, setDemandFilter] = useState<DemandFilter>("semua");
  const [planning, setPlanning] = useState<{ crop: Crop | null; plot: Plot | null; choosePlot: boolean }>({
    crop: null,
    plot: null,
    choosePlot: false,
  });

  const families = useMemo(() => catalog?.families ?? [], [catalog]);
  const crops = useMemo(() => catalog?.crops ?? [], [catalog]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return crops.filter((crop) => {
      if (familyFilter !== "semua" && crop.familyId !== familyFilter) return false;
      if (demandFilter !== "semua" && crop.nutrientDemand !== demandFilter) return false;
      if (!keyword) return true;
      return (
        crop.commonName.toLowerCase().includes(keyword) ||
        (crop.family?.name.toLowerCase().includes(keyword) ?? false) ||
        (crop.family?.label.toLowerCase().includes(keyword) ?? false) ||
        (crop.description?.toLowerCase().includes(keyword) ?? false)
      );
    });
  }, [crops, search, familyFilter, demandFilter]);

  const grouped = useMemo(() => {
    return families
      .map((family) => ({ family, items: filtered.filter((crop) => crop.familyId === family.id) }))
      .filter((group) => group.items.length > 0);
  }, [families, filtered]);

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
        eyebrow="Data referensi"
        title="Katalog Tanaman"
        description="Setiap tanaman dikelompokkan menurut famili botaninya. Famili inilah yang menjadi dasar perhitungan rotasi, bukan nama sayurnya."
        actions={
          <Link href="/panduan" className="btn-secondary">
            <Leaf className="size-4" aria-hidden />
            Panduan rotasi
          </Link>
        }
      />

      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Tanaman terdaftar" value={crops.length} hint="Lengkap dengan famili & kebutuhan hara" icon={Sprout} />
        <StatCard label="Famili botani" value={families.length} hint="Dasar perhitungan jeda rotasi" icon={Leaf} tone="harvest" />
        <StatCard
          label="Pemakan berat"
          value={crops.filter((crop) => crop.nutrientDemand === "high").length}
          hint="Perlu didampingi penambat nitrogen setelahnya"
          icon={CalendarDays}
          tone="clay"
        />
      </section>

      <div className="card-pad mb-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div>
            <Field label="Cari tanaman">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-bark-400" aria-hidden />
                <input
                  className="field pl-9"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="mis. kangkung, tomat, Fabaceae, penambat nitrogen"
                  aria-label="Cari tanaman"
                />
              </div>
            </Field>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setFamilyFilter("semua")}
                className={classNames(
                  "chip transition",
                  familyFilter === "semua" ? "bg-leaf-700 text-white ring-leaf-700" : "bg-white text-bark-600 ring-bark-200 hover:ring-leaf-300",
                )}
              >
                Semua famili
              </button>
              {families.map((family) => (
                <button
                  key={family.id}
                  type="button"
                  onClick={() => setFamilyFilter(family.id === familyFilter ? "semua" : family.id)}
                  className={classNames(
                    "chip transition",
                    family.id === familyFilter ? "text-white" : "bg-white text-bark-700 ring-bark-200 hover:ring-leaf-300",
                  )}
                  style={
                    family.id === familyFilter
                      ? { backgroundColor: family.color, boxShadow: `inset 0 0 0 1px ${family.color}` }
                      : undefined
                  }
                >
                  <span className="size-2 rounded-full" style={{ backgroundColor: family.color }} aria-hidden />
                  {family.name}
                </button>
              ))}
            </div>
          </div>
          <div className="lg:text-right">
            <span className="label">Kebutuhan hara</span>
            <SegmentedControl<DemandFilter>
              size="sm"
              value={demandFilter}
              onChange={setDemandFilter}
              options={[
                { value: "semua", label: "Semua" },
                { value: "high", label: "Tinggi" },
                { value: "medium", label: "Sedang" },
                { value: "low", label: "Rendah" },
              ]}
            />
            <p className="mt-2 text-[11.5px] text-bark-500">{filtered.length} tanaman ditampilkan</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <Spinner label="Memuat katalog tanaman…" />
      ) : grouped.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Tidak ada tanaman yang cocok"
          description="Coba kata kunci lain atau reset filter famili dan kebutuhan hara."
          action={
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setSearch("");
                setFamilyFilter("semua");
                setDemandFilter("semua");
              }}
            >
              Reset filter
            </button>
          }
        />
      ) : (
        <div className="space-y-5">
          {grouped.map(({ family, items }) => (
            <section key={family.id} className="card overflow-hidden">
              <header
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                style={{ backgroundColor: `${family.color}12`, borderBottom: `1px solid ${family.color}33` }}
              >
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-bark-900">
                    <span className="size-3 rounded-full" style={{ backgroundColor: family.color }} aria-hidden />
                    {family.name}
                    <span className="text-sm font-semibold text-bark-500">· {family.label}</span>
                  </h2>
                  <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-bark-600">{family.description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="chip bg-white text-bark-700 ring-bark-200">{ROLE_LABEL[family.role]}</span>
                  <span className="chip bg-white text-bark-700 ring-bark-200">Urutan rotasi #{family.rotationOrder}</span>
                  <span className="chip bg-white text-bark-700 ring-bark-200">{items.length} tanaman</span>
                </div>
              </header>
              <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((crop) => (
                  <article
                    key={crop.id}
                    className="flex flex-col justify-between gap-3 rounded-2xl border border-bark-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-leaf-300 hover:shadow-soft"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display text-[15px] leading-snug font-extrabold text-bark-900">{crop.commonName}</h3>
                        <DemandTag demand={crop.nutrientDemand} />
                      </div>
                      <p className="mt-1.5 text-[12px] leading-relaxed text-bark-600">{crop.description}</p>
                      <p className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-bark-500">
                        <CalendarDays className="size-3.5" aria-hidden />
                        Panen ±{crop.harvestDays} hari
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-secondary w-full px-3 py-2 text-xs"
                      onClick={() => setPlanning({ crop, plot: null, choosePlot: true })}
                    >
                      <Sprout className="size-3.5" aria-hidden />
                      Rencanakan tanam
                    </button>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Pilih petak lalu catat penanaman */}
      <Modal
        open={planning.choosePlot}
        onClose={() => setPlanning({ crop: null, plot: null, choosePlot: false })}
        title={`Pilih petak untuk ${planning.crop?.commonName ?? ""}`}
        description="Catatan tanam akan ditambahkan ke petak yang Anda pilih, lalu mesin rotasi memeriksa apakah familinya aman."
        size="sm"
      >
        {!plots || plots.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="Belum ada petak"
            description="Buat petak terlebih dahulu di halaman Kebun & Petak."
            action={
              <Link href="/kebun" className="btn-primary">
                Ke halaman kebun
              </Link>
            }
          />
        ) : (
          <ul className="space-y-2">
            {plots.map((plot) => (
              <li key={plot.id}>
                <button
                  type="button"
                  onClick={() => setPlanning({ crop: planning.crop, plot, choosePlot: false })}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-bark-200 bg-white p-4 text-left transition hover:border-leaf-400 hover:bg-leaf-50"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-bark-900">{plot.name}</span>
                    <span className="mt-0.5 block truncate text-[11.5px] text-bark-500">
                      {plot.farmName} · {plot.area.toLocaleString("id-ID")} m² · {plot.soilType}
                    </span>
                  </span>
                  <Sprout className="size-4 shrink-0 text-leaf-600" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <PlantingFormModal
        open={Boolean(planning.plot) && Boolean(planning.crop)}
        plot={planning.plot}
        presetCrop={planning.crop}
        onClose={() => setPlanning({ crop: null, plot: null, choosePlot: false })}
      />
    </>
  );
}
