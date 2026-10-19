import { sql } from "drizzle-orm";
import { db } from "@/db";
import { addDays, toISODate, today } from "@/lib/utils";
import { crops, farms, plantFamilies, plantings, plots, profiles, soilTests } from "./schema";

/**
 * Bootstrap database TerraSiklus.
 * 1. Membuat tabel bila belum ada (aman dijalankan berulang, kompatibel Neon/Postgres).
 * 2. Mengisi data referensi famili botani + katalog tanaman.
 * 3. Menyediakan data contoh (profil, kebun, petak, riwayat tanam, uji tanah) saat DB masih kosong.
 *
 * Skrip SQL setara tersedia di `drizzle/0000_terrasyklus_init.sql` untuk migrasi manual ke Neon.
 */

const DDL = `
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  username varchar(80) not null unique,
  full_name varchar(120),
  created_at timestamptz not null default now()
);

create table if not exists farms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name varchar(140) not null,
  location varchar(180),
  created_at timestamptz not null default now()
);

create table if not exists plots (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references farms(id) on delete cascade,
  name varchar(140) not null,
  area numeric(10,2) not null default '0',
  soil_type varchar(60) not null default 'lempung',
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists plant_families (
  id uuid primary key default gen_random_uuid(),
  name varchar(80) not null unique,
  label varchar(140) not null,
  role varchar(30) not null default 'light',
  color varchar(16) not null default '#3F8F4F',
  description text,
  rotation_order integer not null default 0
);

create table if not exists crops (
  id uuid primary key default gen_random_uuid(),
  common_name varchar(140) not null unique,
  family_id uuid not null references plant_families(id) on delete cascade,
  nutrient_demand varchar(12) not null default 'medium',
  harvest_days integer not null default 70,
  description text
);

create table if not exists plantings (
  id uuid primary key default gen_random_uuid(),
  plot_id uuid not null references plots(id) on delete cascade,
  crop_id uuid not null references crops(id) on delete restrict,
  planted_on date not null,
  harvested_on date,
  pest_reported boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists soil_tests (
  id uuid primary key default gen_random_uuid(),
  plot_id uuid not null references plots(id) on delete cascade,
  tested_on date not null,
  ph numeric(5,2) not null,
  n numeric(8,2) not null default '0',
  p numeric(8,2) not null default '0',
  k numeric(8,2) not null default '0',
  organic_matter numeric(6,2) not null default '0',
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists farms_owner_idx on farms(owner_id);
create index if not exists plots_farm_idx on plots(farm_id);
create index if not exists crops_family_idx on crops(family_id);
create index if not exists plantings_plot_idx on plantings(plot_id);
create index if not exists soil_tests_plot_idx on soil_tests(plot_id);
`;

type FamilySeed = {
  name: string;
  label: string;
  role: string;
  color: string;
  rotationOrder: number;
  description: string;
};

const FAMILY_SEED: FamilySeed[] = [
  {
    name: "Solanaceae",
    label: "Terung-terungan",
    role: "heavy",
    color: "#D9503F",
    rotationOrder: 1,
    description: "Tomat, cabai, terung, kentang. Pemakan hara berat, terutama kalium.",
  },
  {
    name: "Brassicaceae",
    label: "Kubis-kubisan",
    role: "heavy",
    color: "#7B5EA7",
    rotationOrder: 2,
    description: "Kubis, brokoli, sawi, lobak. Butuh nitrogen tinggi dan pH mendekati netral.",
  },
  {
    name: "Cucurbitaceae",
    label: "Labu-labuan",
    role: "heavy",
    color: "#E08A1E",
    rotationOrder: 3,
    description: "Mentimun, labu, pare, melon. Merambat, menyukai kompos matang.",
  },
  {
    name: "Apiaceae",
    label: "Wortel-wortelan",
    role: "root",
    color: "#B0762A",
    rotationOrder: 4,
    description: "Wortel, seledri, ketumbar. Tanaman akar pemakan ringan, membantu menggemburkan tanah.",
  },
  {
    name: "Fabaceae",
    label: "Kacang-kacangan",
    role: "fixer",
    color: "#3F8F4F",
    rotationOrder: 5,
    description: "Buncis, kacang panjang, kedelai. Menambat nitrogen bebas lewat bakteri rhizobium.",
  },
  {
    name: "Alliaceae",
    label: "Bawang-bawangan",
    role: "allium",
    color: "#6E7FA8",
    rotationOrder: 6,
    description: "Bawang merah, putih, prei, kucai. Mengusir banyak hama sebagai tanaman pendamping.",
  },
  {
    name: "Asteraceae",
    label: "Selada-seladaan",
    role: "light",
    color: "#D8A81F",
    rotationOrder: 7,
    description: "Selada, kenikir, bunga matahari. Pemakan ringan dengan siklus panen cepat.",
  },
  {
    name: "Poaceae",
    label: "Rumput & serealia",
    role: "cover",
    color: "#8A9A5B",
    rotationOrder: 8,
    description: "Jagung, padi, sorgum. Membangun biomassa, dipakai sebagai tanaman penutup.",
  },
  {
    name: "Amaranthaceae",
    label: "Bayam-bayaman",
    role: "light",
    color: "#C0447A",
    rotationOrder: 9,
    description: "Bayam, bit, swiss chard. Panen cepat, menyukai nitrogen sedang.",
  },
  {
    name: "Lamiaceae",
    label: "Aromatik & herbal",
    role: "aromatic",
    color: "#2E8B8B",
    rotationOrder: 10,
    description: "Kemangi, mint, rosemary. Minyak atsirinya mengusir hama dari bedeng tetangga.",
  },
  {
    name: "Convolvulaceae",
    label: "Kangkung-kangkungan",
    role: "light",
    color: "#4FA3A5",
    rotationOrder: 11,
    description: "Kangkung dan ubi jalar. Menutup tanah rapat sehingga gulma tertekan.",
  },
];

type CropSeed = [name: string, family: string, demand: "high" | "medium" | "low", days: number, description: string];

const CROP_SEED: CropSeed[] = [
  ["Tomat", "Solanaceae", "high", 78, "Butuh ajir dan kalium cukup saat pembuahan."],
  ["Cabai Rawit", "Solanaceae", "high", 85, "Panen berulang, rentan kutu kebul & antraknos."],
  ["Cabai Merah Besar", "Solanaceae", "high", 90, "Menyukai sinar penuh dan drainase baik."],
  ["Terung", "Solanaceae", "high", 80, "Produktif panjang, waspada penggerek buah."],
  ["Kentang", "Solanaceae", "high", 70, "Umbi; hindari pH tinggi agar tidak keropeng."],
  ["Paprika", "Solanaceae", "high", 88, "Cocok di dataran tinggi atau rumah plastik."],
  ["Kubis", "Brassicaceae", "high", 75, "Butuh N tinggi, rentan akar gada di tanah asam."],
  ["Brokoli", "Brassicaceae", "high", 80, "Dataran tinggi, panen sebelum bunga mekar."],
  ["Kembang Kol", "Brassicaceae", "high", 85, "Butuh suhu sejuk dan pemupukan merata."],
  ["Sawi Hijau (Caisim)", "Brassicaceae", "medium", 30, "Panen cepat, cocok sebagai tanaman sela."],
  ["Pakcoy", "Brassicaceae", "medium", 35, "Sayuran daun ideal untuk bedeng sempit."],
  ["Lobak", "Brassicaceae", "low", 30, "Akar tunggangnya membantu menggemburkan tanah."],
  ["Mentimun", "Cucurbitaceae", "medium", 50, "Merambat, butuh air konsisten agar buah tidak pahit."],
  ["Labu Kuning", "Cucurbitaceae", "high", 100, "Daun lebar menutup tanah dan menekan gulma."],
  ["Zucchini", "Cucurbitaceae", "medium", 55, "Produktif, waspada embun tepung."],
  ["Pare", "Cucurbitaceae", "medium", 60, "Tahan panas, cocok ditanam musim kemarau."],
  ["Oyong (Gambas)", "Cucurbitaceae", "medium", 55, "Merambat cepat dan tahan kekeringan."],
  ["Semangka", "Cucurbitaceae", "high", 85, "Menyukai tanah berpasir hangat dan kalium tinggi."],
  ["Melon", "Cucurbitaceae", "high", 78, "Rasa manis optimal bila kalium cukup."],
  ["Wortel", "Apiaceae", "medium", 80, "Butuh tanah gembur tanpa batu agar umbi lurus."],
  ["Seledri", "Apiaceae", "medium", 90, "Menyukai air melimpah dan naungan ringan."],
  ["Daun Ketumbar", "Apiaceae", "low", 45, "Cepat berbunga pada cuaca panas."],
  ["Peterseli", "Apiaceae", "low", 60, "Tahan naungan, cocok di tepi bedeng."],
  ["Adas", "Apiaceae", "medium", 80, "Aromatik, menarik serangga penyerbuk."],
  ["Kacang Panjang", "Fabaceae", "medium", 50, "Penambat nitrogen, panen polong berulang."],
  ["Buncis", "Fabaceae", "medium", 55, "Memulihkan tanah setelah pemakan berat."],
  ["Kacang Tanah", "Fabaceae", "medium", 95, "Menutup tanah dan menekan gulma."],
  ["Kedelai (Edamame)", "Fabaceae", "medium", 75, "Rotasi klasik setelah padi atau jagung."],
  ["Kacang Hijau", "Fabaceae", "low", 60, "Tahan kering, sering dipakai sebagai tanaman sela."],
  ["Kacang Polong", "Fabaceae", "low", 65, "Menyukai musim sejuk, bagus sebagai penutup tanah."],
  ["Bawang Merah", "Alliaceae", "medium", 70, "Mengusir hama wortel, butuh drainase baik."],
  ["Bawang Putih", "Alliaceae", "medium", 120, "Musim panjang, ditanam awal kemarau."],
  ["Bawang Daun (Prei)", "Alliaceae", "medium", 90, "Pendamping alami penolak hama."],
  ["Kucai", "Alliaceae", "low", 60, "Perennial ringan untuk tepi bedeng."],
  ["Selada Keriting", "Asteraceae", "low", 40, "Panen cepat, tahan naungan parsial."],
  ["Selada Romaine", "Asteraceae", "low", 45, "Relatif tahan panas dibanding selada kepala."],
  ["Bunga Matahari", "Asteraceae", "medium", 90, "Menarik penyerbuk, biji bisa dipanen."],
  ["Kenikir", "Asteraceae", "low", 45, "Tanaman pendamping yang menekan nematoda."],
  ["Jagung Manis", "Poaceae", "high", 75, "Pemakan nitrogen berat, tanam bersama kacang."],
  ["Padi", "Poaceae", "high", 110, "Rotasi dengan kacang-kacangan setelah panen."],
  ["Sorgum", "Poaceae", "low", 100, "Tahan kering, biomassa bagus untuk mulsa."],
  ["Bayam Hijau", "Amaranthaceae", "medium", 30, "Panen cepat, menyukai nitrogen cukup."],
  ["Bayam Merah", "Amaranthaceae", "medium", 32, "Kaya zat besi dan tahan panas."],
  ["Bit", "Amaranthaceae", "medium", 60, "Butuh kalium dan tanah gembur."],
  ["Swiss Chard", "Amaranthaceae", "medium", 55, "Panen daun berulang sepanjang musim."],
  ["Kemangi", "Lamiaceae", "low", 40, "Aromatik pengusir lalat dan nyamuk."],
  ["Mint", "Lamiaceae", "low", 60, "Menyebar cepat, tanam di pot atau tepi bedeng."],
  ["Rosemary", "Lamiaceae", "low", 90, "Tahan kering, penolak hama kubis."],
  ["Thyme", "Lamiaceae", "low", 70, "Pendamping baik untuk kubis dan tomat."],
  ["Kangkung", "Convolvulaceae", "low", 25, "Panen super cepat, tahan lahan basah."],
  ["Ubi Jalar", "Convolvulaceae", "medium", 120, "Menutup tanah rapat dan menekan gulma."],
];

function daysAgo(days: number): string {
  return toISODate(addDays(today(), -days));
}

async function seedCatalog() {
  const existingFamilies = await db.select({ count: sql<number>`count(*)::int` }).from(plantFamilies);
  if ((existingFamilies[0]?.count ?? 0) === 0) {
    await db.insert(plantFamilies).values(FAMILY_SEED);
  }
  const existingCrops = await db.select({ count: sql<number>`count(*)::int` }).from(crops);
  if ((existingCrops[0]?.count ?? 0) === 0) {
    const families = await db.select({ id: plantFamilies.id, name: plantFamilies.name }).from(plantFamilies);
    const familyId = new Map(families.map((item) => [item.name, item.id]));
    await db.insert(crops).values(
      CROP_SEED.map(([commonName, familyName, demand, days, description]) => ({
        commonName,
        familyId: familyId.get(familyName)!,
        nutrientDemand: demand,
        harvestDays: days,
        description,
      })),
    );
  }
}

async function seedDemoData() {
  const profileCount = await db.select({ count: sql<number>`count(*)::int` }).from(profiles);
  if ((profileCount[0]?.count ?? 0) > 0) return;

  const [owner] = await db
    .insert(profiles)
    .values({ username: "petani-demo", fullName: "Petani Demo TerraSiklus" })
    .returning({ id: profiles.id });

  const [farmMain] = await db
    .insert(farms)
    .values({ ownerId: owner.id, name: "Kebun Tani Makmur", location: "Lembang, Bandung Barat" })
    .returning({ id: farms.id });

  const [farmHome] = await db
    .insert(farms)
    .values({ ownerId: owner.id, name: "Kebun Rumah Halaman Belakang", location: "Sleman, Yogyakarta" })
    .returning({ id: farms.id });

  const [plotA] = await db
    .insert(plots)
    .values({
      farmId: farmMain.id,
      name: "Petak A – Ujung Utara",
      area: "24",
      soilType: "lempung",
      notes: "Bedeng utama tanaman buah, sinar matahari penuh sepanjang hari.",
    })
    .returning({ id: plots.id });
  const [plotB] = await db
    .insert(plots)
    .values({
      farmId: farmMain.id,
      name: "Petak B – Dekat Sumur",
      area: "18",
      soilType: "berpasir",
      notes: "Drainase cepat, butuh mulsa tebal dan penyiraman dua kali sehari.",
    })
    .returning({ id: plots.id });
  const [plotC] = await db
    .insert(plots)
    .values({
      farmId: farmMain.id,
      name: "Petak C – Bawah Pohon Bambu",
      area: "30",
      soilType: "liat",
      notes: "Sedang dipulihkan setelah serangan layu fusarium pada terung.",
    })
    .returning({ id: plots.id });
  const [plotD] = await db
    .insert(plots)
    .values({
      farmId: farmMain.id,
      name: "Petak D – Terasering",
      area: "12",
      soilType: "lempung berpasir",
      notes: "Bedeng kecil khusus sayuran daun dan umbi.",
    })
    .returning({ id: plots.id });
  const [plotHerbal] = await db
    .insert(plots)
    .values({
      farmId: farmHome.id,
      name: "Petak Herbal",
      area: "6",
      soilType: "volkanis",
      notes: "Kebun dapur tepat di belakang rumah.",
    })
    .returning({ id: plots.id });
  const [plotLeafy] = await db
    .insert(plots)
    .values({
      farmId: farmHome.id,
      name: "Petak Sayur Daun",
      area: "8",
      soilType: "lempung",
      notes: "Naungan parsial pada sore hari.",
    })
    .returning({ id: plots.id });

  const cropRows = await db.select({ id: crops.id, commonName: crops.commonName }).from(crops);
  const cropId = new Map(cropRows.map((item) => [item.commonName, item.id]));
  const byName = (name: string) => cropId.get(name)!;

  await db.insert(plantings).values([
    {
      plotId: plotA.id,
      cropId: byName("Cabai Rawit"),
      plantedOn: daysAgo(340),
      harvestedOn: daysAgo(150),
      pestReported: true,
      notes: "Kutu kebul dan bercak daun muncul di minggu ke-9, hasil menurun tajam pada panen terakhir.",
    },
    {
      plotId: plotA.id,
      cropId: byName("Kacang Panjang"),
      plantedOn: daysAgo(140),
      harvestedOn: daysAgo(70),
      pestReported: false,
      notes: "Tanaman merambat menutup bedeng, tanah terasa lebih gembur setelah panen.",
    },
    {
      plotId: plotA.id,
      cropId: byName("Kubis"),
      plantedOn: daysAgo(68),
      harvestedOn: null,
      pestReported: false,
      notes: "Pemupukan kompos 2 kg/m² sebelum tanam. Pantau ulat kubis setiap pagi.",
    },
    {
      plotId: plotB.id,
      cropId: byName("Mentimun"),
      plantedOn: daysAgo(220),
      harvestedOn: daysAgo(160),
      pestReported: true,
      notes: "Buah busuk di ujung dan embun tepung karena drainase kurang baik.",
    },
    {
      plotId: plotB.id,
      cropId: byName("Jagung Manis"),
      plantedOn: daysAgo(150),
      harvestedOn: daysAgo(70),
      pestReported: false,
      notes: "Tongkol kedua kecil, perlu tambahan nitrogen pada musim berikutnya.",
    },
    {
      plotId: plotB.id,
      cropId: byName("Selada Keriting"),
      plantedOn: daysAgo(36),
      harvestedOn: null,
      pestReported: false,
      notes: "Tumbuh merata, panen potong-dan-tumbuh kembali.",
    },
    {
      plotId: plotC.id,
      cropId: byName("Bawang Merah"),
      plantedOn: daysAgo(260),
      harvestedOn: daysAgo(190),
      pestReported: false,
      notes: "Umbi bagus, sisa daun dijadikan mulsa.",
    },
    {
      plotId: plotC.id,
      cropId: byName("Terung"),
      plantedOn: daysAgo(175),
      harvestedOn: daysAgo(75),
      pestReported: true,
      notes: "Tiga tanaman layu fusarium, sisa tanaman dibakar dan bedeng dikapur.",
    },
    {
      plotId: plotD.id,
      cropId: byName("Bayam Hijau"),
      plantedOn: daysAgo(95),
      harvestedOn: daysAgo(60),
      pestReported: false,
      notes: "Daun lebat, dipanen dua kali dengan jarak 12 hari.",
    },
    {
      plotId: plotD.id,
      cropId: byName("Wortel"),
      plantedOn: daysAgo(26),
      harvestedOn: null,
      pestReported: false,
      notes: "Penjarangan sudah dilakukan, tambahkan pasir agar umbi lurus.",
    },
    {
      plotId: plotHerbal.id,
      cropId: byName("Kemangi"),
      plantedOn: daysAgo(40),
      harvestedOn: null,
      pestReported: false,
      notes: "Siap dipangkas, sisakan dua ruas agar tunas baru cepat keluar.",
    },
    {
      plotId: plotLeafy.id,
      cropId: byName("Pakcoy"),
      plantedOn: daysAgo(20),
      harvestedOn: null,
      pestReported: false,
      notes: "Disiram pagi dan sore, cek ulat grayak pada daun bawah.",
    },
  ]);

  await db.insert(soilTests).values([
    {
      plotId: plotA.id,
      testedOn: daysAgo(210),
      ph: "5.8",
      n: "15",
      p: "12",
      k: "110",
      organicMatter: "2.2",
      notes: "Uji awal musim oleh laboratorium kelompok tani.",
    },
    {
      plotId: plotA.id,
      testedOn: daysAgo(18),
      ph: "6.3",
      n: "24",
      p: "19",
      k: "145",
      organicMatter: "3.2",
      notes: "Setelah penambahan kompos 3 kg/m², populasi cacing meningkat.",
    },
    {
      plotId: plotB.id,
      testedOn: daysAgo(12),
      ph: "5.4",
      n: "11",
      p: "8",
      k: "85",
      organicMatter: "1.6",
      notes: "Tanah berpasir cepat kehilangan hara, perlu dolomit dan mulsa.",
    },
    {
      plotId: plotC.id,
      testedOn: daysAgo(45),
      ph: "6.8",
      n: "30",
      p: "24",
      k: "168",
      organicMatter: "4.1",
      notes: "Kompos matang rutin, struktur liat mulai remah.",
    },
    {
      plotId: plotHerbal.id,
      testedOn: daysAgo(60),
      ph: "6.6",
      n: "26",
      p: "20",
      k: "150",
      organicMatter: "3.8",
      notes: "Tanah volkanis subur, cukup perawatan rutin.",
    },
    {
      plotId: plotLeafy.id,
      testedOn: daysAgo(90),
      ph: "6.4",
      n: "22",
      p: "16",
      k: "130",
      organicMatter: "3.0",
      notes: "Uji mandiri dengan kit tanah sederhana.",
    },
  ]);
}

async function runBootstrap() {
  await db.execute(sql.raw(DDL));
  await seedCatalog();
  await seedDemoData();
}

let readyPromise: Promise<void> | null = null;

/** Pastikan skema & data referensi siap sebelum query pertama dijalankan. */
export function ensureReady(): Promise<void> {
  if (!readyPromise) {
    readyPromise = runBootstrap().catch((error) => {
      readyPromise = null;
      throw error;
    });
  }
  return readyPromise;
}
