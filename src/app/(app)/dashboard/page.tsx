"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Droplets,
  FlaskConical,
  Layers,
  Leaf,
  MapPinned,
  NotebookPen,
  Ruler,
  Sprout,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Callout, EmptyState, ErrorState, FamilyTag, Progress, SkeletonCard, StatCard } from "@/components/ui";
import { useDashboard } from "@/lib/hooks";
import type { NextAction } from "@/lib/types";
import { classNames, daysBetween, formatTanggal, formatTanggalSingkat, todayISO } from "@/lib/utils";

const ACTION_STYLE: Record<
  NextAction["kind"],
  { icon: typeof Sprout; badge: string; label: string }
> = {
  panen: { icon: CalendarClock, badge: "bg-harvest-100 text-harvest-700 ring-harvest-300", label: "Panen" },
  tanam: { icon: Sprout, badge: "bg-leaf-100 text-leaf-800 ring-leaf-200", label: "Tanam" },
  tanah: { icon: FlaskConical, badge: "bg-clay-100 text-clay-700 ring-clay-200", label: "Tanah" },
  hama: { icon: AlertTriangle, badge: "bg-clay-100 text-clay-800 ring-clay-200", label: "Hama" },
  perawatan: { icon: Droplets, badge: "bg-bark-100 text-bark-700 ring-bark-200", label: "Perawatan" },
};

const URGENCY_STYLE: Record<NextAction["urgency"], string> = {
  tinggi: "bg-clay-100 text-clay-800 ring-clay-200",
  sedang: "bg-harvest-100 text-harvest-700 ring-harvest-300",
  rendah: "bg-bark-100 text-bark-600 ring-bark-200",
};

export default function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useDashboard();
  const today = todayISO();

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
        eyebrow="Ringkasan kebun"
        title="Selamat datang kembali di TerraSiklus"
        description="Pantau tanaman yang sedang tumbuh, aksi paling mendesak, dan kondisi tanah tiap petak dalam satu layar."
        actions={
          <>
            <Link href="/kebun" className="btn-secondary">
              <MapPinned className="size-4" aria-hidden />
              Kelola petak
            </Link>
            <Link href="/katalog" className="btn-primary">
              <Leaf className="size-4" aria-hidden />
              Jelajahi katalog
            </Link>
          </>
        }
      />

      {isLoading || !data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Statistik */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Statistik kebun">
            <StatCard
              label="Kebun & petak"
              value={`${data.counts.farms} · ${data.counts.plots}`}
              hint={`${data.counts.totalArea.toLocaleString("id-ID")} m² total lahan terkelola`}
              icon={Layers}
            />
            <StatCard
              label="Tanaman aktif"
              value={data.counts.activePlantings}
              hint={`${data.upcomingHarvests.length} petak mendekati waktu panen`}
              icon={Sprout}
              tone="clay"
            />
            <StatCard
              label="Katalog tanaman"
              value={data.counts.cropsCatalog}
              hint="Lengkap dengan famili botani & tingkat kebutuhan hara"
              icon={Leaf}
              tone="harvest"
            />
            <StatCard
              label="Uji tanah tercatat"
              value={data.counts.soilTests}
              hint="pH, N, P, K, dan bahan organik tiap petak"
              icon={FlaskConical}
              tone="bark"
            />
          </section>

          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            {/* Aksi berikutnya */}
            <section aria-label="Aksi berikutnya">
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-extrabold text-bark-900">Aksi berikutnya</h2>
                  <p className="mt-1 text-[12.5px] text-bark-600">
                    Disusun otomatis dari jadwal panen, kondisi tanah, dan petak yang kosong.
                  </p>
                </div>
                <span className="chip bg-bark-100 text-bark-600 ring-bark-200">{formatTanggal(today)}</span>
              </div>

              {data.nextActions.length === 0 ? (
                <EmptyState
                  icon={TrendingUp}
                  title="Tidak ada aksi mendesak"
                  description="Semua petak terpantau baik. Tambahkan catatan tanam atau uji tanah baru untuk memperkaya rekomendasi."
                />
              ) : (
                <ul className="space-y-2.5">
                  {data.nextActions.map((action) => {
                    const style = ACTION_STYLE[action.kind];
                    const Icon = style.icon;
                    return (
                      <li key={action.id}>
                        <Link
                          href={action.href}
                          className="card flex items-start gap-3.5 p-4 transition hover:-translate-y-0.5 hover:border-leaf-300 hover:shadow-lift"
                        >
                          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-leaf-50 text-leaf-700 ring-1 ring-leaf-100">
                            <Icon className="size-4.5" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className={classNames("chip", style.badge)}>{style.label}</span>
                              <span className={classNames("chip", URGENCY_STYLE[action.urgency])}>
                                Urgensi {action.urgency}
                              </span>
                              <span className="chip bg-white text-bark-500 ring-bark-200">{action.dueLabel}</span>
                            </span>
                            <span className="mt-2 block font-display text-[15px] leading-snug font-bold text-bark-900">
                              {action.title}
                            </span>
                            <span className="mt-1 block text-[12.5px] leading-relaxed text-bark-600">{action.detail}</span>
                          </span>
                          <ArrowRight className="mt-1 size-4 shrink-0 text-bark-300 transition group-hover:text-leaf-600" aria-hidden />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* Tanaman aktif */}
            <section aria-label="Tanaman aktif" className="space-y-6">
              <div className="card-pad">
                <h2 className="font-display text-lg font-extrabold text-bark-900">Sedang tumbuh</h2>
                <p className="mt-1 text-[12.5px] text-bark-600">Progres tiap tanaman menuju perkiraan panen.</p>
                {data.activePlantings.length === 0 ? (
                  <p className="mt-4 rounded-2xl border border-dashed border-bark-300 bg-bark-50/60 p-4 text-sm text-bark-600">
                    Tidak ada tanaman aktif. Buka halaman{" "}
                    <Link href="/kebun" className="font-semibold text-leaf-700 underline">
                      Kebun & Petak
                    </Link>{" "}
                    untuk mencatat penanaman.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3.5">
                    {data.activePlantings.slice(0, 6).map((planting) => {
                      const elapsed = daysBetween(planting.plantedOn, today);
                      const total = planting.crop?.harvestDays ?? 70;
                      const progress = Math.min(100, Math.round((elapsed / Math.max(1, total)) * 100));
                      const due = daysBetween(today, planting.estimatedHarvestOn ?? today);
                      return (
                        <li key={planting.id}>
                          <Link href={`/petak/${planting.plotId}`} className="block rounded-2xl border border-bark-200 bg-bark-50/50 p-3.5 transition hover:border-leaf-300 hover:bg-white">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-bark-900">{planting.crop?.commonName}</p>
                                <p className="mt-0.5 truncate text-[11.5px] text-bark-500">
                                  {planting.plotName} · tanam {formatTanggalSingkat(planting.plantedOn)}
                                </p>
                              </div>
                              {planting.family ? <FamilyTag family={planting.family} compact /> : null}
                            </div>
                            <Progress value={progress} className="mt-2.5" barClassName={due <= 0 ? "bg-harvest-500" : "bg-leaf-600"} />
                            <p
                              className={classNames(
                                "mt-1.5 text-[11px] font-semibold",
                                due < 0 ? "text-clay-600" : due <= 7 ? "text-harvest-700" : "text-bark-500",
                              )}
                            >
                              {due < 0
                                ? `Lewat ${Math.abs(due)} hari dari perkiraan panen`
                                : due === 0
                                  ? "Perkiraan panen hari ini"
                                  : `${due} hari menuju panen (${formatTanggalSingkat(planting.estimatedHarvestOn ?? null)})`}
                            </p>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Distribusi famili */}
              <div className="card-pad">
                <h2 className="font-display text-lg font-extrabold text-bark-900">Famili yang sedang dipakai</h2>
                <p className="mt-1 text-[12.5px] text-bark-600">
                  Keragaman famili pada satu musim menandakan rotasi berjalan sehat.
                </p>
                {data.familyDistribution.length === 0 ? (
                  <p className="mt-4 text-sm text-bark-500">Belum ada tanaman aktif.</p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {data.familyDistribution.map((entry) => {
                      const max = Math.max(...data.familyDistribution.map((item) => item.count));
                      return (
                        <li key={entry.family.id}>
                          <div className="flex items-baseline justify-between gap-2 text-[12.5px]">
                            <span className="font-bold text-bark-800">{entry.family.name}</span>
                            <span className="text-bark-500 tabular-nums">
                              {entry.count} petak · {entry.area.toLocaleString("id-ID")} m²
                            </span>
                          </div>
                          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-bark-100">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${(entry.count / Math.max(1, max)) * 100}%`, backgroundColor: entry.family.color }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Uji tanah terbaru */}
              <div className="card-pad">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-display text-lg font-extrabold text-bark-900">Uji tanah terbaru</h2>
                  <span className="chip bg-bark-100 text-bark-600 ring-bark-200">
                    <Ruler className="size-3" aria-hidden />
                    per petak
                  </span>
                </div>
                {data.recentSoilTests.length === 0 ? (
                  <p className="mt-4 text-sm text-bark-500">Belum ada hasil uji tanah yang tercatat.</p>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {data.recentSoilTests.map((test) => (
                      <li key={test.id}>
                        <Link
                          href={`/petak/${test.plotId}`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-bark-200 bg-bark-50/50 px-3.5 py-2.5 transition hover:border-leaf-300 hover:bg-white"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-[13px] font-bold text-bark-900">{test.plotName}</span>
                            <span className="block text-[11px] text-bark-500">
                              pH {test.ph.toFixed(1)} · N {test.n} · P {test.p} · K {test.k} · {test.organicMatter}% C-org
                            </span>
                          </span>
                          <span className="shrink-0 text-[11px] font-semibold text-bark-500">
                            {formatTanggalSingkat(test.testedOn)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>

          <Callout
            level="info"
            title="Tips rotasi cepat"
            icon={NotebookPen}
          >
            <p>
              Setelah memanen, jangan langsung menanam famili yang sama. Sisipkan kacang-kacangan (Fabaceae) selama satu
              musim untuk mengembalikan nitrogen, lalu lanjutkan ke sayuran daun atau umbi. Catat hasilnya agar TerraSiklus
              dapat memperkirakan musim terbaik berikutnya.
            </p>
            <Link href="/panduan" className="btn-secondary mt-3 px-3.5 py-2 text-xs">
              Baca panduan rotasi
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </Callout>

        </div>
      )}
    </>
  );
}
