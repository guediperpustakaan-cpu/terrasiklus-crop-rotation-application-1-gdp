"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FlaskConical,
  Leaf,
  Recycle,
  ShieldCheck,
  Sparkles,
  Sprout,
} from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { RotationWheel } from "@/components/rotation-wheel";
import { Callout, Spinner } from "@/components/ui";
import { useCatalog } from "@/lib/hooks";
import { MIN_SEASONS_GAP, ROLE_LABEL } from "@/lib/rotation";
import type { PlantFamily } from "@/lib/types";

const PRINSIP = [
  {
    icon: ShieldCheck,
    title: "Hama mengenal keluarga, bukan nama sayur",
    body: "Tomat, cabai, terung, dan kentang sama-sama Solanaceae. Kutu kebul atau layu fusarium yang menyerang cabai akan langsung menemukan inang baru bila musim berikutnya Anda menanam tomat di petak yang sama.",
  },
  {
    icon: Recycle,
    title: `Jeda minimal ${MIN_SEASONS_GAP} musim`,
    body: "Semakin panjang jeda sebuah famili, semakin kecil populasi patogen yang tersisa di tanah. TerraSiklus menghitung jeda ini dari riwayat tanam Anda, bukan dari kalender.",
  },
  {
    icon: Sparkles,
    title: "Urutkan berdasarkan kebutuhan hara",
    body: "Pola klasik: pemakan berat (buah) → penambat nitrogen (kacang) → pemakan ringan (daun) → umbi/akar. Setiap langkah memberi waktu tanah untuk pulih.",
  },
];

const CHECKLIST = [
  "Bersihkan sisa tanaman musim lalu, terutama yang menunjukkan gejala penyakit.",
  "Tambahkan kompos matang 2–4 kg per m² sebelum bedeng dibentuk kembali.",
  "Uji tanah tiap pergantian musim, minimal 4 bulan sekali.",
  "Tanam tanaman aromatik (kemangi, rosemary, thyme) di tepi bedeng sebagai penolak hama.",
  "Catat tanggal tanam, tanggal panen, dan setiap gangguan hama pada hari yang sama.",
  "Sisipkan satu musim kacang-kacangan setelah dua musim pemakan berat.",
];

export default function PanduanPage() {
  const { data: catalog, isLoading } = useCatalog();
  const families: PlantFamily[] = catalog?.families ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Pengetahuan dasar"
        title="Panduan Rotasi Tanaman"
        description="Prinsip yang dipakai mesin rekomendasi TerraSiklus, dijelaskan dengan bahasa kebun sehari-hari."
        actions={
          <Link href="/katalog" className="btn-primary">
            <Leaf className="size-4" aria-hidden />
            Buka katalog tanaman
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          {PRINSIP.map((prinsip, index) => {
            const Icon = prinsip.icon;
            return (
              <article key={prinsip.title} className="card-pad">
                <div className="flex items-start gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-leaf-100 text-leaf-700">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10.5px] font-bold tracking-[0.14em] text-bark-400 uppercase">
                      Prinsip {index + 1}
                    </p>
                    <h2 className="mt-1 font-display text-base font-extrabold text-bark-900">{prinsip.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-bark-600">{prinsip.body}</p>
                  </div>
                </div>
              </article>
            );
          })}

          <Callout level="peringatan" title="Tanda rotasi Anda bermasalah" icon={AlertTriangle}>
            <ul className="space-y-1.5">
              <li>Hama yang sama muncul setiap musim pada petak yang sama.</li>
              <li>Hasil panen menurun padahal dosis pupuk tidak berubah.</li>
              <li>Tanaman kerdil pada satu jenis sayur sementara jenis lain normal.</li>
              <li>Penyakit tanah seperti layu fusarium atau akar gada berulang.</li>
            </ul>
          </Callout>
        </div>

        <div className="card-pad flex flex-col items-center justify-center">
          <h2 className="font-display text-base font-extrabold text-bark-900">Urutan famili dalam satu siklus</h2>
          <p className="mt-1.5 text-center text-[12.5px] leading-relaxed text-bark-600">
            Arahkan kursor pada tiap irisan. Angka menunjukkan urutan rotasi; semakin jauh jarak dua famili yang sama,
            semakin sehat tanahnya.
          </p>
          {isLoading || families.length === 0 ? (
            <div className="py-16">
              <Spinner label="Memuat famili tanaman…" />
            </div>
          ) : (
            <div className="mt-2 w-full">
              <RotationWheel families={families} size={360} centerSubtitle="Urutan rotasi TerraSiklus" />
            </div>
          )}
          <Link href="/kebun" className="btn-secondary mt-4 w-full sm:w-auto">
            Terapkan pada petak saya
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-lg font-extrabold text-bark-900">Peran tiap famili dalam rotasi</h2>
        <p className="mt-1 text-[12.5px] text-bark-600">
          Mesin rotasi memakai peran ini untuk menentukan urutan musim yang paling menguntungkan bagi tanah.
        </p>
        <div className="card mt-4 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-bark-50">
                <tr className="text-[10.5px] font-bold tracking-wide text-bark-500 uppercase">
                  <th className="px-4 py-3">Famili</th>
                  <th className="px-4 py-3">Sebutan lokal</th>
                  <th className="px-4 py-3">Peran rotasi</th>
                  <th className="px-4 py-3">Urutan</th>
                  <th className="px-4 py-3">Catatan</th>
                </tr>
              </thead>
              <tbody>
                {(families.length ? families : []).map((family) => (
                  <tr key={family.id} className="border-t border-bark-100 align-top">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2 font-bold text-bark-900">
                        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: family.color }} aria-hidden />
                        {family.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-bark-700">{family.label}</td>
                    <td className="px-4 py-3">
                      <span className="chip bg-leaf-100 text-leaf-800 ring-leaf-200">{ROLE_LABEL[family.role]}</span>
                    </td>
                    <td className="px-4 py-3 font-display font-extrabold text-bark-900 tabular-nums">#{family.rotationOrder}</td>
                    <td className="px-4 py-3 text-[12.5px] leading-relaxed text-bark-600">{family.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card-pad">
          <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-bark-900">
            <CheckCircle2 className="size-4 text-leaf-600" aria-hidden />
            Checklist sebelum musim tanam baru
          </h2>
          <ul className="mt-4 space-y-2.5">
            {CHECKLIST.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-bark-700">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-leaf-500" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="card-pad">
          <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-bark-900">
            <FlaskConical className="size-4 text-clay-600" aria-hidden />
            Membaca hasil uji tanah
          </h2>
          <ul className="mt-4 space-y-3 text-sm">
            {[
              { label: "pH 6,0 – 7,5", note: "Jendela terbaik penyerapan hara. Di bawah 5,5 beri dolomit; di atas 7,8 beri kompos asam." },
              { label: "Nitrogen 15 – 30 ppm", note: "Di bawah 15: tanam kacang-kacangan atau beri kompos matang satu musim penuh." },
              { label: "Fosfor 10 – 25 ppm", note: "Kurang dari 10 menghambat pembungaan; tambahkan rock phosphate atau tepung tulang." },
              { label: "Kalium 100 – 200 ppm", note: "Penting untuk kualitas buah. Abu kayu dan sekam bisa menambah kalium organik." },
              { label: "Bahan organik 2 – 4 %", note: "Penentu struktur tanah dan daya simpan air. Di bawah 2% prioritaskan mulsa & kompos." },
            ].map((row) => (
              <li key={row.label} className="rounded-xl border border-bark-200 bg-bark-50/60 p-3.5">
                <p className="font-display text-[13px] font-extrabold text-bark-900">{row.label}</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-bark-600">{row.note}</p>
              </li>
            ))}
          </ul>
          <Link href="/kebun" className="btn-secondary mt-4 w-full sm:w-auto">
            <Sprout className="size-4" aria-hidden />
            Perbarui data tanah petak
          </Link>
        </section>
      </div>

      <section className="mt-8 rounded-3xl bg-leaf-800 p-6 text-white shadow-lift sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] text-leaf-200 uppercase">
              <BookOpen className="size-3.5" aria-hidden />
              Mulai praktik
            </p>
            <h2 className="mt-2 font-display text-xl font-extrabold sm:text-2xl">
              Buka petak Anda dan lihat apa kata mesin rotasi.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-leaf-100/80">
              Pilih petak, tentukan tanggal rencana tanam, lalu bandingkan skor tiap tanaman beserta alasannya.
            </p>
          </div>
          <Link href="/kebun" className="btn bg-white text-leaf-900 hover:bg-leaf-50">
            Pilih petak
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>
    </>
  );
}
