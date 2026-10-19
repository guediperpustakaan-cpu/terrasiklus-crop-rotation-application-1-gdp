import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Droplets,
  FlaskConical,
  Leaf,
  LineChart,
  NotebookPen,
  Recycle,
  ShieldCheck,
  Sprout,
  Sun,
} from "lucide-react";
import { RotationWheel } from "@/components/rotation-wheel";
import { countAll } from "@/db/queries";
import type { PlantFamily } from "@/lib/types";

export const dynamic = "force-dynamic";

const FAMILIES: PlantFamily[] = [
  { id: "f1", name: "Solanaceae", label: "Terung-terungan", role: "heavy", color: "#D9503F", description: "Tomat, cabai, kentang", rotationOrder: 1 },
  { id: "f2", name: "Brassicaceae", label: "Kubis-kubisan", role: "heavy", color: "#7B5EA7", description: "Kubis, sawi, brokoli", rotationOrder: 2 },
  { id: "f3", name: "Cucurbitaceae", label: "Labu-labuan", role: "heavy", color: "#E08A1E", description: "Mentimun, labu, melon", rotationOrder: 3 },
  { id: "f4", name: "Apiaceae", label: "Wortel-wortelan", role: "root", color: "#B0762A", description: "Wortel, seledri", rotationOrder: 4 },
  { id: "f5", name: "Fabaceae", label: "Kacang-kacangan", role: "fixer", color: "#3F8F4F", description: "Buncis, kacang panjang", rotationOrder: 5 },
  { id: "f6", name: "Alliaceae", label: "Bawang-bawangan", role: "allium", color: "#6E7FA8", description: "Bawang merah, prei", rotationOrder: 6 },
  { id: "f7", name: "Asteraceae", label: "Selada-seladaan", role: "light", color: "#D8A81F", description: "Selada, kenikir", rotationOrder: 7 },
  { id: "f8", name: "Poaceae", label: "Serealia", role: "cover", color: "#8A9A5B", description: "Jagung, padi", rotationOrder: 8 },
];

const FEATURES = [
  {
    icon: Recycle,
    title: "Mesin rekomendasi rotasi",
    body: "Setiap usulan dihitung dari famili botani musim sebelumnya, jeda musim, kebutuhan hara, riwayat hama, dan hasil uji tanah terbaru.",
    tag: "Inti aplikasi",
  },
  {
    icon: AlertTriangle,
    title: "Peringatan sebelum menanam",
    body: "Mau menanam tomat setelah cabai? TerraSiklus menahan Anda dengan alasan yang jelas: famili sama berarti hama yang sama.",
    tag: "Aturan otomatis",
  },
  {
    icon: FlaskConical,
    title: "Pelacak kesehatan tanah",
    body: "Catat pH, nitrogen, fosfor, kalium, dan bahan organik. Setiap nilai dibaca menjadi status plus saran pembenahan dalam bahasa sehari-hari.",
    tag: "pH · N · P · K · C-organik",
  },
  {
    icon: NotebookPen,
    title: "Jurnal tanam per petak",
    body: "Riwayat lengkap tanggal tanam, tanggal panen, dan catatan hama. Jadi memori jangka panjang kebun Anda.",
    tag: "Riwayat",
  },
  {
    icon: LineChart,
    title: "Dasbor aksi berikutnya",
    body: "Waktunya panen Petak A, Petak B terlalu asam, Petak C kosong — semua tersusun berdasarkan urgensi.",
    tag: "Dasbor",
  },
  {
    icon: BookOpen,
    title: "Katalog 50+ tanaman lokal",
    body: "Tomat, kangkung, kacang panjang, kemangi, hingga ubi jalar — lengkap dengan famili dan tingkat kebutuhan hara.",
    tag: "Referensi",
  },
];

const STEPS = [
  {
    icon: Sprout,
    title: "Buat kebun & petak",
    body: "Tentukan nama kebun, lokasi, lalu pecah menjadi petak dengan luas dan tipe tanah masing-masing.",
  },
  {
    icon: NotebookPen,
    title: "Rekam riwayat tanam",
    body: "Catat apa yang ditanam, kapan mulai, kapan panen, dan gangguan hama yang muncul.",
  },
  {
    icon: Recycle,
    title: "Minta rekomendasi musim depan",
    body: "Mesin rotasi memberi skor, alasan, dan peringatan untuk setiap tanaman di katalog.",
  },
  {
    icon: Droplets,
    title: "Perbarui uji tanah",
    body: "Masukkan hasil uji lab atau kit mandiri, lalu lihat saran pembenahan yang mengikuti.",
  },
];

export default async function LandingPage() {
  let stats: Awaited<ReturnType<typeof countAll>> | null = null;
  try {
    stats = await countAll();
  } catch {
    stats = null;
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* Navigasi */}
      <header className="sticky top-0 z-40 border-b border-bark-200/70 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-leaf-700 text-white shadow-[0_10px_20px_-12px_rgba(24,61,36,1)]">
              <Leaf className="size-5" aria-hidden />
            </span>
            <span className="font-display text-[17px] font-extrabold tracking-tight text-bark-900">
              Terra<span className="text-leaf-700">Siklus</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-bark-600 md:flex" aria-label="Navigasi halaman">
            <a href="#fitur" className="transition hover:text-leaf-700">Fitur</a>
            <a href="#cara-kerja" className="transition hover:text-leaf-700">Cara Kerja</a>
            <a href="#rotasi" className="transition hover:text-leaf-700">Siklus Rotasi</a>
            <a href="#tanah" className="transition hover:text-leaf-700">Kesehatan Tanah</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/panduan" className="btn-ghost hidden sm:inline-flex">Panduan</Link>
            <Link href="/dashboard" className="btn-primary">
              Buka Dasbor
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 -right-32 size-[34rem] rounded-full bg-leaf-200/40 blur-3xl animate-drift" aria-hidden />
        <div className="pointer-events-none absolute -bottom-52 -left-24 size-[28rem] rounded-full bg-harvest-100/70 blur-3xl" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pt-12 pb-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:px-10 lg:pt-20 lg:pb-24">
          <div className="animate-fade-up">
            <span className="chip bg-leaf-100 text-leaf-800 ring-leaf-200">
              <Sun className="size-3.5" aria-hidden />
              Perencanaan musim tanam berbasis data
            </span>
            <h1 className="mt-5 font-display text-[clamp(2.3rem,6.4vw,4.1rem)] leading-[1.02] font-extrabold text-bark-950">
              Tanah yang dirotasi
              <span className="relative mx-2 inline-block">
                <span className="relative z-10 text-leaf-700">tidak pernah lelah</span>
                <span className="absolute inset-x-0 bottom-1 z-0 h-3 rounded-full bg-leaf-300/50" aria-hidden />
              </span>
              panen yang berulang.
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-bark-600 sm:text-base">
              TerraSiklus adalah kalkulator rotasi tanaman sekaligus pelacak kesehatan tanah untuk petani kecil dan
              pekebun rumah. Rencanakan setiap petak berdasarkan famili botani dan riwayat tanah — bukan sekadar tebakan.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/dashboard" className="btn-primary px-5 py-3 text-[15px]">
                Mulai rencanakan kebun
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link href="#cara-kerja" className="btn-secondary px-5 py-3 text-[15px]">
                Lihat cara kerjanya
              </Link>
            </div>
            <dl className="mt-9 grid max-w-lg grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Tanaman di katalog", value: stats ? `${stats.crops}+` : "50+" },
                { label: "Famili botani", value: "11" },
                { label: "Petak contoh", value: stats ? `${stats.plots}` : "6" },
                { label: "Riwayat tanam", value: stats ? `${stats.plantings}` : "12" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-white/70 p-3 ring-1 ring-bark-200/70 backdrop-blur-sm">
                  <dt className="text-[10.5px] font-bold tracking-wide text-bark-500 uppercase">{item.label}</dt>
                  <dd className="mt-1 font-display text-xl font-extrabold text-leaf-800 tabular-nums">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative animate-fade-up">
            <div className="overflow-hidden rounded-[28px] shadow-lift ring-1 ring-bark-900/10">
              <Image
                src="/images/hero-garden.jpg"
                alt="Bedeng sayuran yang tertata dengan famili tanaman berbeda di setiap petak"
                width={1200}
                height={900}
                priority
                sizes="(max-width: 1024px) 100vw, 46vw"
                className="h-auto w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-5 -left-3 w-[15rem] rounded-2xl bg-white/95 p-4 shadow-lift ring-1 ring-bark-200 backdrop-blur sm:-left-6">
              <p className="text-[10.5px] font-bold tracking-wide text-bark-500 uppercase">Rekomendasi musim ini</p>
              <p className="mt-1.5 flex items-center gap-2 font-display text-sm font-extrabold text-bark-900">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: "#3F8F4F" }} aria-hidden />
                Kacang Panjang
              </p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-bark-100">
                <div className="h-full w-[92%] rounded-full bg-leaf-600" />
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-bark-600">
                Skor 92 · memulihkan nitrogen setelah cabai (Solanaceae)
              </p>
            </div>
            <div className="absolute -top-4 right-2 rounded-2xl bg-bark-900/90 p-3.5 text-white shadow-lift backdrop-blur sm:-right-4">
              <p className="flex items-center gap-2 text-[11px] font-semibold text-leaf-200">
                <ShieldCheck className="size-4" aria-hidden />
                Aturan jeda 3 musim
              </p>
              <p className="mt-1 max-w-[12rem] text-[11px] leading-snug text-white/70">
                Famili yang sama tidak boleh diulang sebelum 3 musim berlalu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Fitur */}
      <section id="fitur" className="border-y border-bark-200/70 bg-white/60 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold tracking-[0.16em] text-leaf-700 uppercase">Fitur</p>
            <h2 className="mt-2 font-display text-[clamp(1.8rem,4vw,2.6rem)] leading-tight font-extrabold text-bark-950">
              Satu tempat untuk perencanaan, pencatatan, dan pemulihan tanah.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-bark-600">
              Bukan sekadar catatan. TerraSiklus membaca riwayat Anda lalu memberi keputusan yang bisa langsung diikuti.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className={`group relative overflow-hidden rounded-2xl border border-bark-200/70 bg-white p-6 transition hover:-translate-y-1 hover:border-leaf-300 hover:shadow-lift ${
                    index === 0 ? "lg:col-span-2 lg:row-span-1" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-leaf-100 text-leaf-700 transition group-hover:bg-leaf-700 group-hover:text-white">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10.5px] font-bold tracking-[0.14em] text-bark-400 uppercase">{feature.tag}</p>
                      <h3 className="mt-1 font-display text-base leading-snug font-bold text-bark-900">{feature.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-bark-600">{feature.body}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cara kerja */}
      <section id="cara-kerja" className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
            <div>
              <p className="text-[11px] font-bold tracking-[0.16em] text-leaf-700 uppercase">Alur kerja</p>
              <h2 className="mt-2 font-display text-[clamp(1.8rem,4vw,2.6rem)] leading-tight font-extrabold text-bark-950">
                Empat langkah dari bedeng kosong ke rencana musim.
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-bark-600">
                Setiap langkah menyimpan data yang membuat langkah berikutnya lebih pintar. Semakin lama dipakai, semakin
                akurat saran rotasinya.
              </p>
              <Link href="/kebun" className="btn-primary mt-6">
                Kelola kebun saya
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            <ol className="relative space-y-4">
              <span className="absolute top-6 bottom-6 left-[27px] w-px bg-gradient-to-b from-leaf-300 via-leaf-200 to-transparent" aria-hidden />
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <li key={step.title} className="relative flex gap-4 rounded-2xl bg-white p-5 shadow-soft ring-1 ring-bark-200/70">
                    <span className="relative z-10 grid size-14 shrink-0 place-items-center rounded-2xl bg-leaf-700 text-white shadow-[0_10px_22px_-14px_rgba(24,61,36,1)]">
                      <Icon className="size-6" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold tracking-[0.14em] text-leaf-700 uppercase">Langkah {index + 1}</p>
                      <h3 className="mt-1 font-display text-base font-bold text-bark-900">{step.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-bark-600">{step.body}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>

      {/* Siklus rotasi */}
      <section id="rotasi" className="border-y border-bark-200/70 bg-bark-950 py-16 text-white sm:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-10">
          <div>
            <p className="text-[11px] font-bold tracking-[0.16em] text-leaf-300 uppercase">Siklus famili</p>
            <h2 className="mt-2 font-display text-[clamp(1.8rem,4vw,2.6rem)] leading-tight font-extrabold">
              Rotasi bukan soal tanaman, tapi soal keluarganya.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-white/70">
              Tomat dan cabai sama-sama Solanaceae. Kubis dan sawi sama-sama Brassicaceae. Hama dan penyakit mengenal
              keluarga, bukan nama sayuran. Pindahkan famili ke urutan berikutnya setiap musim, dan populasi hama kehilangan
              inangnya.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-white/80">
              {[
                "Pemakan berat (Solanaceae, Brassicaceae) diikuti penambat nitrogen (Fabaceae).",
                "Tanaman umbi & akar memecah tanah padat sebelum musim daun berikutnya.",
                "Famili aromatik disisipkan untuk mengusir hama dari bedeng tetangga.",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-leaf-300" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/panduan" className="btn-secondary mt-7 border-white/20 bg-white/10 text-white hover:border-leaf-300 hover:bg-white/15 hover:text-white">
              Baca panduan lengkap
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="flex justify-center">
            <RotationWheel families={FAMILIES} size={380} centerSubtitle="Arahkan kursor ke tiap irisan" />
          </div>
        </div>
      </section>

      {/* Tanah */}
      <section id="tanah" className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-10">
          <div className="relative order-2 lg:order-1">
            <div className="overflow-hidden rounded-[28px] shadow-lift ring-1 ring-bark-900/10">
              <Image
                src="/images/soil-hands.jpg"
                alt="Tangan petani memegang tanah subur dengan bibit muda"
                width={1200}
                height={900}
                loading="lazy"
                sizes="(max-width: 1024px) 100vw, 46vw"
                className="h-auto w-full object-cover"
              />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-[11px] font-bold tracking-[0.16em] text-leaf-700 uppercase">Kesehatan tanah</p>
            <h2 className="mt-2 font-display text-[clamp(1.8rem,4vw,2.6rem)] leading-tight font-extrabold text-bark-950">
              Angka lab yang berubah menjadi tindakan.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-bark-600">
              Masukkan hasil uji tanah, TerraSiklus menerjemahkannya menjadi status dan saran konkret — termasuk memengaruhi
              rekomendasi rotasi pada petak tersebut.
            </p>
            <div className="mt-7 space-y-4">
              {[
                { label: "pH tanah", value: "6,3", status: "Ideal", tone: "bg-leaf-600", ratio: 72, note: "Jendela serap hara 6,0–7,5" },
                { label: "Nitrogen (N)", value: "24 ppm", status: "Ideal", tone: "bg-leaf-500", ratio: 64, note: "Cukup untuk sayuran daun" },
                { label: "Fosfor (P)", value: "8 ppm", status: "Rendah", tone: "bg-harvest-500", ratio: 28, note: "Tambahkan rock phosphate" },
                { label: "Kalium (K)", value: "145 ppm", status: "Ideal", tone: "bg-leaf-500", ratio: 58, note: "Mendukung pembuahan" },
                { label: "Bahan organik", value: "3,2 %", status: "Ideal", tone: "bg-leaf-600", ratio: 60, note: "Struktur tanah remah" },
              ].map((row) => (
                <div key={row.label} className="rounded-2xl border border-bark-200/70 bg-white p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-bold text-bark-900">{row.label}</p>
                    <p className="font-display text-sm font-extrabold text-bark-900 tabular-nums">{row.value}</p>
                  </div>
                  <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-bark-100">
                    <div className={`h-full rounded-full ${row.tone}`} style={{ width: `${row.ratio}%` }} />
                  </div>
                  <p className="mt-2 text-[11.5px] text-bark-500">
                    <span className="font-semibold text-bark-700">{row.status}</span> · {row.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-16 sm:px-6 lg:px-10">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-leaf-800 px-6 py-14 text-center shadow-lift sm:px-12">
          <div className="pointer-events-none absolute inset-0 grain opacity-40" aria-hidden />
          <div className="relative">
            <Leaf className="mx-auto size-9 text-leaf-200" aria-hidden />
            <h2 className="mx-auto mt-5 max-w-2xl font-display text-[clamp(1.7rem,4vw,2.5rem)] leading-tight font-extrabold text-white">
              Mulai dari satu petak. Biarkan datanya bekerja untuk musim berikutnya.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-leaf-100/80">
              Sudah tersedia kebun contoh dengan riwayat tanam dan hasil uji tanah agar Anda bisa langsung melihat cara
              mesin rotasi mengambil keputusan.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/dashboard" className="btn bg-white text-leaf-900 hover:bg-leaf-50">
                Buka dasbor sekarang
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link href="/katalog" className="btn border border-white/25 bg-white/10 text-white hover:bg-white/20">
                Jelajahi katalog tanaman
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-bark-200/70 bg-white/60 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:px-6 sm:text-left lg:px-10">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-leaf-700 text-white">
              <Leaf className="size-4" aria-hidden />
            </span>
            <div>
              <p className="font-display text-sm font-extrabold text-bark-900">TerraSiklus</p>
              <p className="text-[11px] text-bark-500">Kalkulator rotasi tanaman & pelacak kesehatan tanah</p>
            </div>
          </div>
          <p className="text-xs text-bark-500">
            Dibangun dengan Next.js, TypeScript, Tailwind CSS, dan Neon PostgreSQL.
          </p>
        </div>
      </footer>
    </div>
  );
}
