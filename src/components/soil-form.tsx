"use client";

import { useState } from "react";
import { FlaskConical, Info, Save, Trash2, TrendingUp } from "lucide-react";
import { Callout, EmptyState, Field, Modal, Progress } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useSoilTestMutations } from "@/lib/hooks";
import { buildSoilReport, soilTestAgeLabel, STATUS_BAR } from "@/lib/soil";
import type { Plot, SoilTest } from "@/lib/types";
import { classNames, formatTanggal, todayISO } from "@/lib/utils";

const FIELD_DEFS = [
  { key: "ph", label: "pH tanah", unit: "pH", step: 0.1, min: 0, max: 14, hint: "Ideal 6,0 – 7,5", placeholder: "6.5" },
  { key: "n", label: "Nitrogen (N)", unit: "ppm", step: 1, min: 0, max: 500, hint: "Ideal 15 – 30 ppm", placeholder: "24" },
  { key: "p", label: "Fosfor (P)", unit: "ppm", step: 1, min: 0, max: 500, hint: "Ideal 10 – 25 ppm", placeholder: "19" },
  { key: "k", label: "Kalium (K)", unit: "ppm", step: 1, min: 0, max: 1000, hint: "Ideal 100 – 200 ppm", placeholder: "145" },
  {
    key: "organicMatter",
    label: "Bahan organik",
    unit: "%",
    step: 0.1,
    min: 0,
    max: 100,
    hint: "Ideal 2 – 4 %",
    placeholder: "3.2",
  },
] as const;

type FieldKey = (typeof FIELD_DEFS)[number]["key"];

export function SoilFormModal({
  open,
  onClose,
  plot,
}: {
  open: boolean;
  onClose: () => void;
  plot: Plot | null;
}) {
  if (!open) return null;
  return <SoilFormBody key={plot?.id ?? "petak"} plot={plot} onClose={onClose} />;
}

function SoilFormBody({ plot, onClose }: { plot: Plot | null; onClose: () => void }) {
  const { push } = useToast();
  const { create } = useSoilTestMutations();
  const [testedOn, setTestedOn] = useState(todayISO());
  const [values, setValues] = useState<Record<FieldKey, string>>({ ph: "6.5", n: "20", p: "15", k: "130", organicMatter: "3" });
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!plot) return;

    const parsed: Record<FieldKey, number> = { ph: 0, n: 0, p: 0, k: 0, organicMatter: 0 };
    for (const def of FIELD_DEFS) {
      const value = Number(values[def.key]);
      if (!Number.isFinite(value)) {
        setError(`${def.label} harus berupa angka.`);
        return;
      }
      if (value < def.min || value > def.max) {
        setError(`${def.label} harus di antara ${def.min} dan ${def.max} ${def.unit}.`);
        return;
      }
      parsed[def.key] = value;
    }

    create.mutate(
      { plotId: plot.id, testedOn, ...parsed, notes: notes.trim() || undefined },
      {
        onSuccess: () => {
          const report = buildSoilReport({
            id: "baru",
            plotId: plot.id,
            testedOn,
            ...parsed,
            notes: notes.trim() || null,
            createdAt: new Date().toISOString(),
          });
          push({
            kind: report.score >= 70 ? "sukses" : "peringatan",
            title: `Uji tanah tersimpan — skor ${report.score}/100 (${report.grade})`,
            detail: report.headline,
          });
          onClose();
        },
        onError: (err) => push({ kind: "error", title: "Gagal menyimpan uji tanah", detail: err.message }),
      },
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={plot ? `Catat uji tanah ${plot.name}` : "Catat uji tanah"}
      description="Isi hasil uji laboratorium atau kit tanah mandiri. Nilai ini langsung memengaruhi rekomendasi rotasi."
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={create.isPending}>
            Batal
          </button>
          <button type="submit" form="soil-form" className="btn-primary" disabled={create.isPending}>
            <Save className="size-4" aria-hidden />
            {create.isPending ? "Menyimpan…" : "Simpan hasil uji"}
          </button>
        </>
      }
    >
      <form id="soil-form" onSubmit={submit} className="space-y-4">
        <Field label="Tanggal uji" required>
          <input
            className="field"
            type="date"
            value={testedOn}
            max={todayISO()}
            onChange={(event) => setTestedOn(event.target.value)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          {FIELD_DEFS.map((def) => (
            <Field key={def.key} label={`${def.label} (${def.unit})`} required hint={def.hint}>
              <input
                className="field"
                type="number"
                step={def.step}
                min={def.min}
                max={def.max}
                value={values[def.key]}
                placeholder={def.placeholder}
                inputMode="decimal"
                onChange={(event) => {
                  setValues((current) => ({ ...current, [def.key]: event.target.value }));
                  setError(null);
                }}
              />
            </Field>
          ))}
        </div>

        <Field label="Catatan pengujian" hint="Nama lab, metode, perlakuan sebelumnya (kompos, kapur, pupuk).">
          <textarea
            className="field min-h-20 resize-y"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="mis. Uji mandiri dengan kit tanah, sampel diambil dari 5 titik petak."
            maxLength={2000}
          />
        </Field>

        {error ? (
          <Callout level="bahaya" title="Periksa kembali isian" icon={Info}>
            <p>{error}</p>
          </Callout>
        ) : (
          <Callout level="info" title="Petunjuk singkat" icon={Info}>
            <p>
              Ambil sampel dari 5 titik petak sedalam 20 cm, campur rata, lalu kering-anginkan sebelum diuji. Uji ulang
              setiap 4 bulan atau setiap pergantian musim.
            </p>
          </Callout>
        )}
      </form>
    </Modal>
  );
}

/* --------------------------- panel kesehatan tanah -------------------------- */

export function SoilHealthPanel({
  plot,
  tests,
  onAdd,
  onDelete,
}: {
  plot: Plot;
  tests: SoilTest[];
  onAdd: () => void;
  onDelete: (test: SoilTest) => void;
}) {
  const latest = tests[0];

  if (!latest) {
    return (
      <EmptyState
        icon={FlaskConical}
        title="Belum ada hasil uji tanah"
        description={`Catat pH, nitrogen, fosfor, kalium, dan bahan organik ${plot.name} agar rekomendasi rotasi memperhitungkan kondisi hara.`}
        action={
          <button type="button" className="btn-primary" onClick={onAdd}>
            <FlaskConical className="size-4" aria-hidden />
            Isi uji tanah pertama
          </button>
        }
      />
    );
  }

  const report = buildSoilReport(latest);
  const circumference = 2 * Math.PI * 42;

  return (
    <div className="space-y-5">
      <div className="card-pad">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative grid size-28 shrink-0 place-items-center">
            <svg viewBox="0 0 100 100" className="size-28 -rotate-90">
              <circle cx="50" cy="50" r="42" className="fill-none stroke-bark-100" strokeWidth="10" />
              <circle
                cx="50"
                cy="50"
                r="42"
                className="fill-none stroke-leaf-600 transition-all duration-700"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - report.score / 100)}
              />
            </svg>
            <div className="absolute text-center">
              <p className="font-display text-2xl leading-none font-extrabold text-bark-900 tabular-nums">{report.score}</p>
              <p className="text-[10px] font-semibold text-bark-500">dari 100</p>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-lg font-extrabold text-bark-900">{report.grade}</h3>
              <span className="chip bg-bark-100 text-bark-600 ring-bark-200">{soilTestAgeLabel(latest.testedOn)}</span>
              <span className="chip bg-leaf-100 text-leaf-800 ring-leaf-200">{formatTanggal(latest.testedOn)}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-bark-600">{report.headline}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="btn-primary px-3.5 py-2 text-xs" onClick={onAdd}>
                <FlaskConical className="size-3.5" aria-hidden />
                Catat uji baru
              </button>
              {report.actions.length > 0 ? (
                <span className="chip bg-harvest-100 text-harvest-700 ring-harvest-300">
                  {report.actions.length} tindakan disarankan
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="card-pad">
        <h4 className="text-xs font-bold tracking-wide text-bark-500 uppercase">Indikator terkini</h4>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {report.metrics.map((metric) => (
            <div key={metric.key} className="rounded-2xl border border-bark-200 bg-bark-50/50 p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-bold text-bark-900">{metric.label}</p>
                <p className="font-display text-base font-extrabold text-bark-900 tabular-nums">
                  {metric.key === "ph" ? metric.value.toFixed(1) : metric.value}
                  <span className="ml-1 text-[11px] font-semibold text-bark-500">{metric.unit === "pH" ? "" : metric.unit}</span>
                </p>
              </div>
              <Progress value={metric.ratio} className="mt-2.5" barClassName={STATUS_BAR[metric.status]} />
              <p className="mt-2 flex items-center gap-2 text-[11px]">
                <span
                  className={classNames(
                    "chip",
                    metric.status === "ideal"
                      ? "bg-leaf-100 text-leaf-800 ring-leaf-200"
                      : metric.status === "kritis"
                        ? "bg-clay-100 text-clay-800 ring-clay-200"
                        : "bg-harvest-100 text-harvest-700 ring-harvest-300",
                  )}
                >
                  {metric.statusLabel}
                </span>
                <span className="text-bark-500">Optimal {metric.optimalRange}</span>
              </p>
              <p className="mt-2 text-[11.5px] leading-relaxed text-bark-600">{metric.advice}</p>
            </div>
          ))}
        </div>
      </div>

      {tests.length > 1 ? (
        <div className="card-pad">
          <div className="flex items-center justify-between gap-2">
            <h4 className="flex items-center gap-2 text-xs font-bold tracking-wide text-bark-500 uppercase">
              <TrendingUp className="size-3.5" aria-hidden />
              Riwayat uji tanah ({tests.length})
            </h4>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-bark-200 text-[11px] font-bold tracking-wide text-bark-500 uppercase">
                  <th className="py-2 pr-3">Tanggal</th>
                  <th className="py-2 pr-3">pH</th>
                  <th className="py-2 pr-3">N</th>
                  <th className="py-2 pr-3">P</th>
                  <th className="py-2 pr-3">K</th>
                  <th className="py-2 pr-3">C-org</th>
                  <th className="py-2 pr-3">Skor</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {tests.map((test) => {
                  const rowReport = buildSoilReport(test);
                  const previous = tests.find((item) => item.testedOn < test.testedOn);
                  const phDelta = previous ? test.ph - previous.ph : null;
                  return (
                    <tr key={test.id} className="border-b border-bark-100 last:border-0">
                      <td className="py-2.5 pr-3 font-semibold text-bark-800">{formatTanggal(test.testedOn)}</td>
                      <td className="py-2.5 pr-3 tabular-nums text-bark-700">
                        {test.ph.toFixed(1)}
                        {phDelta !== null ? (
                          <span className={classNames("ml-1.5 text-[11px] font-bold", phDelta >= 0 ? "text-leaf-600" : "text-clay-500")}>
                            {phDelta >= 0 ? "▲" : "▼"} {Math.abs(phDelta).toFixed(1)}
                          </span>
                        ) : null}
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums text-bark-700">{test.n}</td>
                      <td className="py-2.5 pr-3 tabular-nums text-bark-700">{test.p}</td>
                      <td className="py-2.5 pr-3 tabular-nums text-bark-700">{test.k}</td>
                      <td className="py-2.5 pr-3 tabular-nums text-bark-700">{test.organicMatter}%</td>
                      <td className="py-2.5 pr-3">
                        <span className="font-display text-sm font-extrabold text-bark-900 tabular-nums">{rowReport.score}</span>
                        <span className="ml-1.5 text-[11px] font-semibold text-leaf-700">{rowReport.grade}</span>
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => onDelete(test)}
                          className="rounded-lg p-1.5 text-bark-400 transition hover:bg-clay-50 hover:text-clay-600"
                          aria-label={`Hapus uji tanah ${formatTanggal(test.testedOn)}`}
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {latest.notes ? (
        <Callout level="info" title="Catatan pengujian terakhir" icon={Info}>
          <p>{latest.notes}</p>
        </Callout>
      ) : null}
    </div>
  );
}
