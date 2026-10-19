"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CalendarDays, Check, Leaf, Search, ShieldAlert, ShieldCheck, Sprout } from "lucide-react";
import { Callout, DemandTag, FamilyTag, Field, Modal, ScoreBar, Spinner } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useCatalog, usePlantingCheck, usePlantingMutations } from "@/lib/hooks";
import type { Crop, Plot } from "@/lib/types";
import { addDaysISO, classNames, formatTanggal, todayISO } from "@/lib/utils";

const LEVEL_META = {
  aman: { callout: "sukses", icon: ShieldCheck },
  peringatan: { callout: "peringatan", icon: AlertTriangle },
  bahaya: { callout: "bahaya", icon: ShieldAlert },
} as const;

export function PlantingFormModal({
  open,
  onClose,
  plot,
  presetCrop = null,
}: {
  open: boolean;
  onClose: () => void;
  plot: Plot | null;
  presetCrop?: Crop | null;
}) {
  if (!open) return null;
  return (
    <PlantingFormBody
      key={`${plot?.id ?? "petak"}-${presetCrop?.id ?? "bebas"}`}
      plot={plot}
      presetCrop={presetCrop}
      onClose={onClose}
    />
  );
}

function PlantingFormBody({
  plot,
  presetCrop,
  onClose,
}: {
  plot: Plot | null;
  presetCrop: Crop | null;
  onClose: () => void;
}) {
  const { push } = useToast();
  const { data: catalog } = useCatalog();
  const { create } = usePlantingMutations();

  const [search, setSearch] = useState("");
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(presetCrop);
  const [plantedOn, setPlantedOn] = useState(todayISO());
  const [harvestedOn, setHarvestedOn] = useState("");
  const [pestReported, setPestReported] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const check = usePlantingCheck(plot?.id ?? "", selectedCrop?.id ?? "", plantedOn);

  const results = useMemo(() => {
    const all = catalog?.crops ?? [];
    const keyword = search.trim().toLowerCase();
    if (!keyword) return all.slice(0, 24);
    return all
      .filter(
        (crop) =>
          crop.commonName.toLowerCase().includes(keyword) ||
          (crop.family?.name.toLowerCase().includes(keyword) ?? false) ||
          (crop.family?.label.toLowerCase().includes(keyword) ?? false),
      )
      .slice(0, 30);
  }, [catalog, search]);

  const estimatedHarvest = selectedCrop ? addDaysISO(plantedOn, selectedCrop.harvestDays) : null;
  const meta = check.data ? LEVEL_META[check.data.level] : null;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!plot) return;
    if (!selectedCrop) {
      setError("Pilih tanaman dari katalog terlebih dahulu.");
      return;
    }
    if (harvestedOn && harvestedOn < plantedOn) {
      setError("Tanggal panen tidak boleh lebih awal dari tanggal tanam.");
      return;
    }

    create.mutate(
      {
        plotId: plot.id,
        cropId: selectedCrop.id,
        plantedOn,
        harvestedOn: harvestedOn || null,
        notes: notes.trim() || undefined,
        pestReported,
      },
      {
        onSuccess: (_data, variables) => {
          void _data;
          const level = check.data?.level;
          if (level === "bahaya") {
            push({
              kind: "peringatan",
              title: `Tercatat, tetapi waspada: ${selectedCrop?.commonName}`,
              detail: check.data?.messages[0] ?? "Famili ini diulang terlalu cepat.",
            });
          } else if (level === "peringatan") {
            push({
              kind: "info",
              title: `Catatan tanam disimpan`,
              detail: check.data?.messages[0] ?? "Perhatikan jeda rotasi keluarga tanaman.",
            });
          } else {
            push({
              kind: "sukses",
              title: "Catatan tanam disimpan",
              detail: `${selectedCrop?.commonName} di ${plot.name} — ditanam ${formatTanggal(variables.plantedOn)}.`,
            });
          }
          onClose();
        },
        onError: (err) => push({ kind: "error", title: "Gagal menyimpan catatan", detail: err.message }),
      },
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={plot ? `Catat penanaman di ${plot.name}` : "Catat penanaman"}
      description="Rekam apa yang ditanam, kapan, dan gangguan yang muncul. Data ini menjadi dasar rekomendasi rotasi musim berikutnya."
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={create.isPending}>
            Batal
          </button>
          <button type="submit" form="planting-form" className="btn-primary" disabled={create.isPending}>
            <Sprout className="size-4" aria-hidden />
            {create.isPending ? "Menyimpan…" : "Simpan catatan tanam"}
          </button>
        </>
      }
    >
      <form id="planting-form" onSubmit={submit} className="space-y-5">
        {/* Pemilih tanaman */}
        <div>
          <span className="label">Pilih tanaman</span>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-bark-400" aria-hidden />
            <input
              className="field pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama tanaman atau famili, mis. tomat, kacang, Brassicaceae"
              disabled={Boolean(selectedCrop)}
            />
          </div>

          {selectedCrop ? (
            <div className="mt-3 flex items-start justify-between gap-3 rounded-2xl bg-leaf-50 p-4 ring-1 ring-leaf-200">
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-display text-base font-extrabold text-bark-900">
                  <Check className="size-4 text-leaf-700" aria-hidden />
                  {selectedCrop.commonName}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedCrop.family ? <FamilyTag family={selectedCrop.family} /> : null}
                  <DemandTag demand={selectedCrop.nutrientDemand} />
                  <span className="chip bg-white text-bark-600 ring-bark-200">
                    <CalendarDays className="size-3" aria-hidden />
                    {selectedCrop.harvestDays} hari
                  </span>
                </div>
              </div>
              <button type="button" className="btn-ghost shrink-0 px-3 py-1.5 text-xs" onClick={() => setSelectedCrop(null)}>
                Ganti
              </button>
            </div>
          ) : (
            <div className="mt-3 max-h-64 space-y-1.5 overflow-y-auto rounded-2xl border border-bark-200 bg-bark-50/60 p-2">
              {!catalog ? (
                <Spinner label="Memuat katalog…" />
              ) : results.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-bark-500">
                  Tidak ada tanaman yang cocok dengan “{search}”.
                </p>
              ) : (
                results.map((crop) => (
                  <button
                    key={crop.id}
                    type="button"
                    onClick={() => {
                      setSelectedCrop(crop);
                      setError(null);
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-xl bg-white px-3.5 py-2.5 text-left ring-1 ring-bark-200/70 transition hover:ring-leaf-400"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-bark-900">{crop.commonName}</span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        {crop.family ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: crop.family.color }}>
                            <span className="size-1.5 rounded-full" style={{ backgroundColor: crop.family.color }} aria-hidden />
                            {crop.family.name}
                          </span>
                        ) : null}
                        <span className="text-[11px] text-bark-500">· panen ±{crop.harvestDays} hari</span>
                      </span>
                    </span>
                    <DemandTag demand={crop.nutrientDemand} />
                  </button>
                ))
              )}
            </div>
          )}
          {error ? <p className="mt-2 text-xs font-medium text-clay-600">{error}</p> : null}
        </div>

        {/* Tanggal */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Tanggal tanam"
            required
            hint="Boleh diisi tanggal di masa depan untuk merencanakan musim berikutnya."
          >
            <input
              className="field"
              type="date"
              value={plantedOn}
              onChange={(event) => setPlantedOn(event.target.value)}
            />
          </Field>
          <Field
            label="Tanggal panen"
            hint={
              estimatedHarvest
                ? `Kosongkan bila masih tumbuh. Perkiraan panen: ${formatTanggal(estimatedHarvest)}.`
                : "Kosongkan bila tanaman masih tumbuh."
            }
          >
            <input
              className="field"
              type="date"
              value={harvestedOn}
              onChange={(event) => setHarvestedOn(event.target.value)}
              min={plantedOn}
            />
          </Field>
        </div>

        {/* Pemeriksaan rotasi langsung */}
        {selectedCrop && plot ? (
          check.isPending ? (
            <div className="rounded-2xl border border-bark-200 bg-bark-50 p-4">
              <Spinner label="Mesin rotasi sedang memeriksa famili…" />
            </div>
          ) : check.data && meta ? (
            <div className="space-y-3">
              <Callout
                level={meta.callout as "sukses" | "peringatan" | "bahaya"}
                title={check.data.title}
                icon={meta.icon}
              >
                <ul className="space-y-1.5">
                  {check.data.messages.map((message) => (
                    <li key={message} className="flex gap-2">
                      <Leaf className="mt-1 size-3.5 shrink-0 opacity-60" aria-hidden />
                      <span>{message}</span>
                    </li>
                  ))}
                </ul>
              </Callout>

              {check.data.level !== "aman" && check.data.suggestions.length > 0 ? (
                <div className="rounded-2xl border border-bark-200 bg-white p-4">
                  <p className="text-xs font-bold tracking-wide text-bark-500 uppercase">Alternatif yang lebih aman</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {check.data.suggestions.slice(0, 4).map((suggestion) => (
                      <button
                        key={suggestion.crop.id}
                        type="button"
                        onClick={() => setSelectedCrop(suggestion.crop)}
                        className="rounded-xl border border-bark-200 p-3 text-left transition hover:border-leaf-400 hover:bg-leaf-50"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-bold text-bark-900">{suggestion.crop.commonName}</p>
                          <span className="font-display text-sm font-extrabold text-leaf-700 tabular-nums">
                            {suggestion.score}
                          </span>
                        </div>
                        <ScoreBar score={suggestion.score} className="mt-2" />
                        <p className="mt-2 text-[11px] leading-snug text-bark-500">
                          {suggestion.family.name} · {suggestion.reasons[0] ?? "Famili berbeda dari musim lalu."}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null
        ) : null}

        {/* Hama & catatan */}
        <div className="space-y-4 rounded-2xl border border-bark-200 bg-bark-50/60 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={pestReported}
              onChange={(event) => setPestReported(event.target.checked)}
              className="mt-0.5 size-4 accent-clay-600"
            />
            <span>
              <span className="block text-sm font-bold text-bark-900">Ada gangguan hama atau penyakit</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-bark-600">
                Centang bila musim ini terserang hama/penyakit. Famili ini akan dihindari mesin rotasi selama minimal 3
                musim ke depan.
              </span>
            </span>
          </label>
          <Field label="Catatan musim tanam" hint="Jenis hama, hasil panen, perlakuan pupuk, cuaca.">
            <textarea
              className={classNames("field min-h-24 resize-y")}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="mis. Ulat grayak muncul minggu ke-5, disemprot ekstrak nimba. Hasil 12 kg."
              maxLength={2000}
            />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
