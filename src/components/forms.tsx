"use client";

import { useState } from "react";
import { MapPin, Plus, Save, Sprout } from "lucide-react";
import { Field, Modal } from "@/components/ui";
import { useFarmMutations, useFarms, usePlotMutations } from "@/lib/hooks";
import { useToast } from "@/components/toast";
import type { Farm, Plot } from "@/lib/types";
import { SOIL_TYPES } from "@/lib/utils";

/* ------------------------------ formulir kebun ----------------------------- */

export function FarmFormModal({
  open,
  onClose,
  farm,
}: {
  open: boolean;
  onClose: () => void;
  farm?: Farm | null;
}) {
  if (!open) return null;
  return <FarmFormBody key={farm?.id ?? "kebun-baru"} farm={farm} onClose={onClose} />;
}

function FarmFormBody({ farm, onClose }: { farm?: Farm | null; onClose: () => void }) {
  const { push } = useToast();
  const { create, update } = useFarmMutations();
  const [name, setName] = useState(farm?.name ?? "");
  const [location, setLocation] = useState(farm?.location ?? "");
  const [error, setError] = useState<string | null>(null);
  const pending = create.isPending || update.isPending;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Nama kebun wajib diisi.");
      return;
    }
    const payload = { name: name.trim(), location: location.trim() || undefined };
    if (farm) {
      update.mutate(
        { id: farm.id, ...payload },
        {
          onSuccess: () => {
            push({ kind: "sukses", title: "Kebun diperbarui", detail: farm.name });
            onClose();
          },
          onError: (err) => push({ kind: "error", title: "Gagal menyimpan", detail: err.message }),
        },
      );
    } else {
      create.mutate(payload, {
        onSuccess: () => {
          push({ kind: "sukses", title: "Kebun dibuat", detail: `${payload.name} siap diisi petak.` });
          onClose();
        },
        onError: (err) => push({ kind: "error", title: "Gagal membuat kebun", detail: err.message }),
      });
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={farm ? "Ubah kebun" : "Tambah kebun baru"}
      description="Kebun adalah wadah untuk beberapa petak. Isi lokasi agar catatan iklim dan musim lebih mudah dipahami."
      size="sm"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={pending}>
            Batal
          </button>
          <button type="submit" form="farm-form" className="btn-primary" disabled={pending}>
            <Save className="size-4" aria-hidden />
            {pending ? "Menyimpan…" : farm ? "Simpan perubahan" : "Buat kebun"}
          </button>
        </>
      }
    >
      <form id="farm-form" onSubmit={submit} className="space-y-4">
        <Field label="Nama kebun" required error={error ?? undefined}>
          <input
            className="field"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError(null);
            }}
            placeholder="mis. Kebun Tani Makmur"
            maxLength={140}
            autoFocus
          />
        </Field>
        <Field label="Lokasi" hint="Desa/kota membantu mengingat kondisi iklim setempat.">
          <div className="relative">
            <MapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-bark-400" aria-hidden />
            <input
              className="field pl-9"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="mis. Lembang, Bandung Barat"
              maxLength={180}
            />
          </div>
        </Field>
      </form>
    </Modal>
  );
}

/* ------------------------------ formulir petak ----------------------------- */

export function PlotFormModal({
  open,
  onClose,
  plot,
  defaultFarmId,
}: {
  open: boolean;
  onClose: () => void;
  plot?: Plot | null;
  defaultFarmId?: string;
}) {
  if (!open) return null;
  return (
    <PlotFormBody
      key={`${plot?.id ?? "petak-baru"}-${defaultFarmId ?? ""}`}
      plot={plot}
      defaultFarmId={defaultFarmId}
      onClose={onClose}
    />
  );
}

function PlotFormBody({
  plot,
  defaultFarmId,
  onClose,
}: {
  plot?: Plot | null;
  defaultFarmId?: string;
  onClose: () => void;
}) {
  const { push } = useToast();
  const { create, update } = usePlotMutations();
  const { data: farms } = useFarms();
  const [farmId, setFarmId] = useState(plot?.farmId ?? defaultFarmId ?? farms?.[0]?.id ?? "");
  const [name, setName] = useState(plot?.name ?? "");
  const [area, setArea] = useState(plot ? String(plot.area) : "12");
  const [soilType, setSoilType] = useState(plot?.soilType ?? "lempung");
  const [notes, setNotes] = useState(plot?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const pending = create.isPending || update.isPending;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!farmId) {
      setError("Pilih kebun terlebih dahulu.");
      return;
    }
    if (!name.trim()) {
      setError("Nama petak wajib diisi.");
      return;
    }
    const parsedArea = Number(area);
    if (!Number.isFinite(parsedArea) || parsedArea <= 0) {
      setError("Luas petak harus berupa angka lebih dari 0.");
      return;
    }

    if (plot) {
      update.mutate(
        { id: plot.id, name: name.trim(), area: parsedArea, soilType, notes: notes.trim() || undefined },
        {
          onSuccess: () => {
            push({ kind: "sukses", title: "Petak diperbarui", detail: plot.name });
            onClose();
          },
          onError: (err) => push({ kind: "error", title: "Gagal menyimpan", detail: err.message }),
        },
      );
    } else {
      create.mutate(
        { farmId, name: name.trim(), area: parsedArea, soilType, notes: notes.trim() || undefined },
        {
          onSuccess: () => {
            push({ kind: "sukses", title: "Petak ditambahkan", detail: `${name.trim()} siap direncanakan.` });
            onClose();
          },
          onError: (err) => push({ kind: "error", title: "Gagal menambah petak", detail: err.message }),
        },
      );
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={plot ? "Ubah petak" : "Tambah petak baru"}
      description="Petak adalah bedeng atau lahan tanam yang rotasinya dihitung terpisah."
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={pending}>
            Batal
          </button>
          <button type="submit" form="plot-form" className="btn-primary" disabled={pending}>
            <Save className="size-4" aria-hidden />
            {pending ? "Menyimpan…" : plot ? "Simpan perubahan" : "Tambah petak"}
          </button>
        </>
      }
    >
      <form id="plot-form" onSubmit={submit} className="space-y-4">
        <Field label="Kebun" required>
          <div className="relative">
            <Sprout className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-bark-400" aria-hidden />
            <select
              className="field appearance-none pl-9"
              value={farmId}
              onChange={(event) => setFarmId(event.target.value)}
            >
              {(farms ?? []).map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.name}
                  {farm.location ? ` — ${farm.location}` : ""}
                </option>
              ))}
            </select>
          </div>
        </Field>

        <Field label="Nama petak" required error={error ?? undefined}>
          <input
            className="field"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError(null);
            }}
            placeholder="mis. Petak A – Ujung Utara"
            maxLength={140}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Luas (m²)" required hint="Dipakai untuk menghitung kebutuhan kompos & kapur.">
            <input
              className="field"
              type="number"
              min={0.1}
              max={100000}
              step={0.5}
              value={area}
              onChange={(event) => setArea(event.target.value)}
              inputMode="decimal"
            />
          </Field>
          <Field label="Tipe tanah" required>
            <select className="field" value={soilType} onChange={(event) => setSoilType(event.target.value)}>
              {SOIL_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Catatan petak" hint="Opsional — drainase, naungan, sumber air, dll.">
          <textarea
            className="field min-h-20 resize-y"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="mis. Drainase cepat, butuh mulsa tebal."
            maxLength={500}
          />
        </Field>
      </form>
    </Modal>
  );
}

export function QuickAddButtons({ onFarm, onPlot }: { onFarm: () => void; onPlot: () => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" className="btn-secondary" onClick={onFarm}>
        <Plus className="size-4" aria-hidden />
        Kebun
      </button>
      <button type="button" className="btn-primary" onClick={onPlot}>
        <Plus className="size-4" aria-hidden />
        Petak
      </button>
    </div>
  );
}
