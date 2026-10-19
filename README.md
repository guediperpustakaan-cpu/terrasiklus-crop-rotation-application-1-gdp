# TerraSiklus 🌱

**Kalkulator rotasi tanaman & pelacak kesehatan tanah** untuk petani kecil dan pekebun rumah.
Seluruh antarmuka berbahasa Indonesia.

TerraSiklus menganalisis riwayat tanam tiap petak, lalu menyarankan tanaman untuk musim berikutnya
berdasarkan **famili botani**, **kebutuhan hara**, **riwayat hama**, dan **hasil uji tanah terakhir**.

---

## Tumpukan teknologi

| Lapisan | Teknologi |
| --- | --- |
| Frontend | React 19, Next.js (App Router), TypeScript, Tailwind CSS v4, Lucide React |
| Data fetching | TanStack Query v5 (`src/lib/hooks.ts`) |
| Backend | Next.js Route Handlers (`src/app/api/*`) |
| Database | PostgreSQL (Neon) melalui Drizzle ORM (`src/db/*`) |

> Catatan: lingkungan proyek ini memakai Next.js App Router. Route handler di `src/app/api`
> berperan sebagai *serverless function* yang menghubungkan React ke Neon — setara dengan
> kebutuhan "API endpoints" pada spesifikasi.

## Menjalankan

```bash
# 1. Siapkan variabel lingkungan (gunakan string koneksi Neon)
echo 'DATABASE_URL=postgresql://USER:PASSWORD@ep-xxxx.neon.tech/neondb?sslmode=require' > .env

# 2. Instal dependensi
npm install

# 3. Terapkan skema
npx drizzle-kit push          # cara cepat
# atau jalankan migrasi SQL:
npx drizzle-kit migrate       # memakai folder drizzle/

# 4. Jalankan
npm run dev                   # pengembangan
npm run build && npm start    # produksi
```

Pada permintaan pertama, `src/db/bootstrap.ts` otomatis:

1. membuat tabel bila belum ada (idempoten, aman di Neon),
2. mengisi data referensi **11 famili botani** dan **51 tanaman**,
3. mengisi data contoh (2 kebun, 6 petak, 12 catatan tanam, 6 uji tanah) bila basis data masih kosong.

## Skema basis data

`profiles` → `farms` → `plots` → (`plantings`, `soil_tests`), dengan data referensi
`plant_families` → `crops`.

Skrip migrasi: `drizzle/0000_terrasyklus_init.sql`.

## API

| Method & rute | Fungsi |
| --- | --- |
| `GET /api/health` | Pemeriksaan koneksi basis data |
| `GET /api/bootstrap` | Pastikan skema + data referensi siap, kembalikan profil & jumlah data |
| `GET /api/dashboard` | Statistik, daftar "Aksi Berikutnya", tanaman aktif, distribusi famili |
| `GET/POST /api/farms` | Daftar / buat kebun |
| `GET/PATCH/DELETE /api/farms/:id` | Detail / ubah / hapus kebun |
| `GET/POST /api/plots` | Daftar / buat petak (`?view=cards` untuk ringkasan lengkap, `?farmId=` untuk filter) |
| `GET/PATCH/DELETE /api/plots/:id` | Detail petak + riwayat + uji tanah + analisis rotasi (`?plannedOn=YYYY-MM-DD`) |
| `GET /api/crops` | Data referensi famili & katalog tanaman |
| `GET/POST /api/plantings` | Daftar / buat catatan tanam (respons menyertakan hasil pemeriksaan rotasi) |
| `PATCH/DELETE /api/plantings/:id` | Ubah (mis. tandai panen) / hapus catatan tanam |
| `GET/POST /api/soil-tests` | Daftar / buat hasil uji tanah (pH, N, P, K, bahan organik) |
| `DELETE /api/soil-tests/:id` | Hapus hasil uji tanah |
| `GET /api/recommendations?plotId=&plannedOn=` | **Mesin rotasi**: rekomendasi, daftar hindari, peringatan, rencana 4 musim |
| `POST /api/validate-planting` | Peringatan rotasi langsung sebelum catatan tanam disimpan |

Semua respons berbentuk `{ data: ... }` atau `{ error: "pesan" }`.

## Mesin rotasi (`src/lib/rotation.ts`)

Skor 0–100 dihitung dari:

| Faktor | Pengaruh |
| --- | --- |
| Famili berbeda dari musim sebelumnya | `+18` (famili sama: `-48`) |
| Jeda famili ≥ 3 musim | `+7` (belum pernah dipakai: `+10`) |
| Famili dipakai ≤ 1 musim lalu | `-20` |
| Kacang-kacangan setelah pemakan berat | `+14` |
| Pemakan berat setelah musim kacang | `+10` |
| Nitrogen tanah < 15 ppm & famili penambat N | `+11` |
| Bahan organik < 2% & tanaman penutup/penambat | `+8` |
| pH < 5,8 pada Brassicaceae (akar gada) | `-14` |
| Riwayat hama pada famili tersebut | `-20` |
| Kondisi tanah berpasir/liat terhadap jenis tanaman | `-4` s/d `-7` |

Verdict: `≥86` sangat dianjurkan · `≥70` dianjurkan · `≥50` hati-hati · di bawah itu hindari.
Setiap rekomendasi selalu menyertakan **alasan** dan **peringatan** dalam Bahasa Indonesia,
misalnya *"Keluarga tanaman berbeda untuk mencegah hama: Fabaceae menggantikan Solanaceae."*

## Struktur komponen

```
src/
├─ app/
│  ├─ page.tsx                 # Landing page (Bahasa Indonesia)
│  ├─ (app)/
│  │  ├─ dashboard/page.tsx    # Dasbor + Aksi Berikutnya
│  │  ├─ kebun/page.tsx        # Manajemen kebun & petak
│  │  ├─ petak/[id]/page.tsx   # Detail petak: rotasi, riwayat, tanah
│  │  ├─ katalog/page.tsx      # Katalog tanaman per famili
│  │  ├─ riwayat/page.tsx      # Jurnal tanam seluruh petak
│  │  └─ panduan/page.tsx      # Panduan rotasi interaktif
│  └─ api/                     # Route handlers (serverless)
├─ components/
│  ├─ app-shell.tsx            # Layout: sidebar desktop + navigasi mobile
│  ├─ plot-card.tsx            # PlotCard
│  ├─ rotation-engine.tsx      # RotationEngine
│  ├─ soil-form.tsx            # SoilForm + SoilHealthPanel
│  ├─ planting-form.tsx        # Form catatan tanam + validasi rotasi langsung
│  ├─ forms.tsx                # Form kebun & petak
│  ├─ rotation-wheel.tsx       # Diagram lingkaran siklus famili
│  └─ ui.tsx                   # Primitif UI (Modal, Badge, StatCard, dll.)
├─ db/
│  ├─ schema.ts                # Definisi tabel Drizzle
│  ├─ bootstrap.ts             # DDL idempoten + seed katalog & data contoh
│  └─ queries.ts               # Lapisan akses data & agregasi dasbor
└─ lib/
   ├─ rotation.ts              # Mesin rekomendasi rotasi (pure TS)
   ├─ soil.ts                  # Interpretasi hasil uji tanah
   ├─ types.ts                 # Antarmuka TypeScript bersama
   ├─ hooks.ts                 # TanStack Query hooks & mutations
   └─ api-client.ts            # Klien HTTP bertipe
```

## Validasi

```bash
npx next typegen
npm exec tsc -- --noEmit
npm run build
```
