import { asc, count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureReady } from "./bootstrap";
import { crops, farms, plantFamilies, plantings, plots, profiles, soilTests } from "./schema";
import type {
  CatalogResponse,
  Crop,
  DashboardData,
  Farm,
  NextAction,
  PlantFamily,
  Planting,
  Plot,
  PlotDetail,
  PlotSummary,
  Profile,
  SoilTest,
} from "@/lib/types";
import { analyzeRotation, checkPlanting } from "@/lib/rotation";
import { addDaysISO, daysBetween, formatRelatif, todayISO } from "@/lib/utils";
import { buildSoilReport, soilTestIsStale } from "@/lib/soil";

const num = (value: string | number | null | undefined): number => (value == null ? 0 : Number(value));
const iso = (value: Date | string | null | undefined): string =>
  value == null ? new Date().toISOString() : value instanceof Date ? value.toISOString() : value;

function mapFamily(row: typeof plantFamilies.$inferSelect): PlantFamily {
  return {
    id: row.id,
    name: row.name,
    label: row.label,
    role: row.role as PlantFamily["role"],
    color: row.color,
    description: row.description,
    rotationOrder: row.rotationOrder,
  };
}

function mapCrop(row: typeof crops.$inferSelect, family?: typeof plantFamilies.$inferSelect): Crop {
  return {
    id: row.id,
    commonName: row.commonName,
    familyId: row.familyId,
    nutrientDemand: row.nutrientDemand as Crop["nutrientDemand"],
    harvestDays: row.harvestDays,
    description: row.description,
    family: family ? mapFamily(family) : undefined,
  };
}

function mapPlot(row: typeof plots.$inferSelect, farmName?: string): Plot {
  return {
    id: row.id,
    farmId: row.farmId,
    farmName,
    name: row.name,
    area: num(row.area),
    soilType: row.soilType,
    notes: row.notes,
    isActive: row.isActive,
    createdAt: iso(row.createdAt),
  };
}

function mapPlanting(
  row: typeof plantings.$inferSelect,
  crop?: Crop,
  plot?: Plot,
): Planting {
  return {
    id: row.id,
    plotId: row.plotId,
    cropId: row.cropId,
    plantedOn: row.plantedOn,
    harvestedOn: row.harvestedOn,
    pestReported: row.pestReported,
    notes: row.notes,
    createdAt: iso(row.createdAt),
    crop,
    family: crop?.family,
    plot,
    plotName: plot?.name,
    estimatedHarvestOn: addDaysISO(row.plantedOn, crop?.harvestDays ?? 70),
  };
}

function mapSoilTest(row: typeof soilTests.$inferSelect): SoilTest {
  return {
    id: row.id,
    plotId: row.plotId,
    testedOn: row.testedOn,
    ph: num(row.ph),
    n: num(row.n),
    p: num(row.p),
    k: num(row.k),
    organicMatter: num(row.organicMatter),
    notes: row.notes,
    createdAt: iso(row.createdAt),
  };
}

/* ---------------------------------- owner --------------------------------- */

export async function getOrCreateOwner(): Promise<Profile> {
  await ensureReady();
  const existing = await db.select().from(profiles).orderBy(asc(profiles.createdAt)).limit(1);
  if (existing[0]) {
    return {
      id: existing[0].id,
      username: existing[0].username,
      fullName: existing[0].fullName,
      createdAt: iso(existing[0].createdAt),
    };
  }
  const [created] = await db
    .insert(profiles)
    .values({ username: "petani-demo", fullName: "Petani Demo TerraSiklus" })
    .returning();
  return {
    id: created.id,
    username: created.username,
    fullName: created.fullName,
    createdAt: iso(created.createdAt),
  };
}

/* ---------------------------------- farms --------------------------------- */

export async function listFarms(): Promise<Farm[]> {
  await ensureReady();
  const owner = await getOrCreateOwner();
  const rows = await db
    .select({ farm: farms, plotCount: count(plots.id) })
    .from(farms)
    .leftJoin(plots, eq(plots.farmId, farms.id))
    .where(eq(farms.ownerId, owner.id))
    .groupBy(farms.id)
    .orderBy(asc(farms.createdAt));

  return rows.map(({ farm, plotCount }) => ({
    id: farm.id,
    ownerId: farm.ownerId,
    name: farm.name,
    location: farm.location,
    createdAt: iso(farm.createdAt),
    plotCount: Number(plotCount),
  }));
}

export async function getFarm(id: string): Promise<Farm | null> {
  await ensureReady();
  const rows = await db.select().from(farms).where(eq(farms.id, id)).limit(1);
  const farm = rows[0];
  if (!farm) return null;
  return {
    id: farm.id,
    ownerId: farm.ownerId,
    name: farm.name,
    location: farm.location,
    createdAt: iso(farm.createdAt),
  };
}

export async function createFarm(input: { name: string; location?: string | null }): Promise<Farm> {
  await ensureReady();
  const owner = await getOrCreateOwner();
  const [row] = await db
    .insert(farms)
    .values({ ownerId: owner.id, name: input.name, location: input.location ?? null })
    .returning();
  return {
    id: row.id,
    ownerId: row.ownerId,
    name: row.name,
    location: row.location,
    createdAt: iso(row.createdAt),
  };
}

export async function updateFarm(id: string, input: { name?: string; location?: string | null }): Promise<Farm | null> {
  await ensureReady();
  const [row] = await db
    .update(farms)
    .set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.location !== undefined ? { location: input.location } : {}),
    })
    .where(eq(farms.id, id))
    .returning();
  if (!row) return null;
  return { id: row.id, ownerId: row.ownerId, name: row.name, location: row.location, createdAt: iso(row.createdAt) };
}

export async function deleteFarm(id: string): Promise<void> {
  await ensureReady();
  await db.delete(farms).where(eq(farms.id, id));
}

/* ---------------------------------- plots --------------------------------- */

export async function listPlots(farmId?: string): Promise<Plot[]> {
  await ensureReady();
  const rows = await db
    .select({ plot: plots, farm: farms })
    .from(plots)
    .innerJoin(farms, eq(plots.farmId, farms.id))
    .orderBy(asc(plots.name));
  return rows
    .filter(({ plot }) => !farmId || plot.farmId === farmId)
    .map(({ plot, farm }) => mapPlot(plot, farm.name));
}

export async function getPlot(id: string): Promise<Plot | null> {
  await ensureReady();
  const rows = await db
    .select({ plot: plots, farm: farms })
    .from(plots)
    .innerJoin(farms, eq(plots.farmId, farms.id))
    .where(eq(plots.id, id))
    .limit(1);
  if (!rows[0]) return null;
  return mapPlot(rows[0].plot, rows[0].farm.name);
}

export async function createPlot(input: {
  farmId: string;
  name: string;
  area: number;
  soilType: string;
  notes?: string | null;
}): Promise<Plot> {
  await ensureReady();
  const [row] = await db
    .insert(plots)
    .values({
      farmId: input.farmId,
      name: input.name,
      area: String(input.area),
      soilType: input.soilType,
      notes: input.notes ?? null,
    })
    .returning();
  return mapPlot(row);
}

export async function updatePlot(
  id: string,
  input: { name?: string; area?: number; soilType?: string; notes?: string | null; isActive?: boolean },
): Promise<Plot | null> {
  await ensureReady();
  const [row] = await db
    .update(plots)
    .set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.area !== undefined ? { area: String(input.area) } : {}),
      ...(input.soilType !== undefined ? { soilType: input.soilType } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    })
    .where(eq(plots.id, id))
    .returning();
  return row ? mapPlot(row) : null;
}

export async function deletePlot(id: string): Promise<void> {
  await ensureReady();
  await db.delete(plots).where(eq(plots.id, id));
}

/* --------------------------------- katalog -------------------------------- */

export async function getCatalog(): Promise<CatalogResponse> {
  await ensureReady();
  const familyRows = await db
    .select({ family: plantFamilies, cropCount: count(crops.id) })
    .from(plantFamilies)
    .leftJoin(crops, eq(crops.familyId, plantFamilies.id))
    .groupBy(plantFamilies.id)
    .orderBy(asc(plantFamilies.rotationOrder));

  const cropRows = await db
    .select({ crop: crops, family: plantFamilies })
    .from(crops)
    .innerJoin(plantFamilies, eq(crops.familyId, plantFamilies.id))
    .orderBy(asc(crops.commonName));

  return {
    families: familyRows.map(({ family }) => mapFamily(family)),
    crops: cropRows.map(({ crop, family }) => mapCrop(crop, family)),
  };
}

/* -------------------------------- plantings ------------------------------- */

export async function listPlantings(filter?: { plotId?: string; farmId?: string; limit?: number }): Promise<Planting[]> {
  await ensureReady();
  const rows = await db
    .select({ planting: plantings, crop: crops, family: plantFamilies, plot: plots, farm: farms })
    .from(plantings)
    .innerJoin(crops, eq(plantings.cropId, crops.id))
    .innerJoin(plantFamilies, eq(crops.familyId, plantFamilies.id))
    .innerJoin(plots, eq(plantings.plotId, plots.id))
    .innerJoin(farms, eq(plots.farmId, farms.id))
    .orderBy(desc(plantings.plantedOn));

  return rows
    .filter(({ planting, plot }) => {
      if (filter?.plotId && planting.plotId !== filter.plotId) return false;
      if (filter?.farmId && plot.farmId !== filter.farmId) return false;
      return true;
    })
    .slice(0, filter?.limit ?? rows.length)
    .map(({ planting, crop, family, plot, farm }) =>
      mapPlanting(planting, mapCrop(crop, family), { ...mapPlot(plot, farm.name) }),
    );
}

export async function createPlanting(input: {
  plotId: string;
  cropId: string;
  plantedOn: string;
  harvestedOn?: string | null;
  notes?: string | null;
  pestReported?: boolean;
}): Promise<Planting> {
  await ensureReady();
  const [row] = await db
    .insert(plantings)
    .values({
      plotId: input.plotId,
      cropId: input.cropId,
      plantedOn: input.plantedOn,
      harvestedOn: input.harvestedOn || null,
      notes: input.notes ?? null,
      pestReported: input.pestReported ?? false,
    })
    .returning();
  const enriched = await listPlantings({ plotId: input.plotId });
  return enriched.find((item) => item.id === row.id) ?? mapPlanting(row);
}

export async function updatePlanting(
  id: string,
  input: { plantedOn?: string; harvestedOn?: string | null; notes?: string | null; pestReported?: boolean; cropId?: string },
): Promise<Planting | null> {
  await ensureReady();
  const [row] = await db
    .update(plantings)
    .set({
      ...(input.plantedOn !== undefined ? { plantedOn: input.plantedOn } : {}),
      ...(input.harvestedOn !== undefined ? { harvestedOn: input.harvestedOn || null } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.pestReported !== undefined ? { pestReported: input.pestReported } : {}),
      ...(input.cropId !== undefined ? { cropId: input.cropId } : {}),
    })
    .where(eq(plantings.id, id))
    .returning();
  if (!row) return null;
  const enriched = await listPlantings();
  return enriched.find((item) => item.id === row.id) ?? mapPlanting(row);
}

export async function deletePlanting(id: string): Promise<void> {
  await ensureReady();
  await db.delete(plantings).where(eq(plantings.id, id));
}

/* ------------------------------- soil tests ------------------------------- */

export async function listSoilTests(filter?: { plotId?: string; limit?: number }): Promise<SoilTest[]> {
  await ensureReady();
  const query = filter?.plotId
    ? db.select().from(soilTests).where(eq(soilTests.plotId, filter.plotId)).orderBy(desc(soilTests.testedOn))
    : db.select().from(soilTests).orderBy(desc(soilTests.testedOn));
  const rows = await query;
  return rows.slice(0, filter?.limit ?? rows.length).map(mapSoilTest);
}

export async function createSoilTest(input: {
  plotId: string;
  testedOn: string;
  ph: number;
  n: number;
  p: number;
  k: number;
  organicMatter: number;
  notes?: string | null;
}): Promise<SoilTest> {
  await ensureReady();
  const [row] = await db
    .insert(soilTests)
    .values({
      plotId: input.plotId,
      testedOn: input.testedOn,
      ph: String(input.ph),
      n: String(input.n),
      p: String(input.p),
      k: String(input.k),
      organicMatter: String(input.organicMatter),
      notes: input.notes ?? null,
    })
    .returning();
  return mapSoilTest(row);
}

export async function deleteSoilTest(id: string): Promise<void> {
  await ensureReady();
  await db.delete(soilTests).where(eq(soilTests.id, id));
}

/* ------------------------------ plot detail ------------------------------ */

export async function getPlotDetail(id: string, plannedOn = todayISO()): Promise<PlotDetail | null> {
  await ensureReady();
  const plot = await getPlot(id);
  if (!plot) return null;
  const farm = await getFarm(plot.farmId);
  const [history, tests, catalog] = await Promise.all([
    listPlantings({ plotId: id }),
    listSoilTests({ plotId: id }),
    getCatalog(),
  ]);

  const analysis = analyzeRotation({
    plot,
    history,
    soilTest: tests[0] ?? null,
    catalog: catalog.crops,
    plannedOn,
  });

  return {
    plot,
    farm: farm ?? {
      id: plot.farmId,
      ownerId: "",
      name: plot.farmName ?? "Kebun",
      location: null,
      createdAt: plot.createdAt,
    },
    history,
    soilTests: tests,
    analysis,
  };
}

/* ----------------------------- ringkasan petak ---------------------------- */

/** Ringkasan lengkap tiap petak: status, tanaman aktif, uji tanah terbaru, dan rekomendasi teratas. */
export async function listPlotSummaries(): Promise<PlotSummary[]> {
  await ensureReady();
  const [allPlots, allPlantings, allSoilTests, catalog] = await Promise.all([
    listPlots(),
    listPlantings(),
    listSoilTests(),
    getCatalog(),
  ]);
  const today = todayISO();

  return allPlots.map((plot) => {
    const history = allPlantings.filter((item) => item.plotId === plot.id);
    const tests = allSoilTests.filter((item) => item.plotId === plot.id);
    const latest = tests[0] ?? null;
    const activePlanting = history.find((item) => !item.harvestedOn && item.plantedOn <= today) ?? null;
    const analysis = analyzeRotation({
      plot,
      history,
      soilTest: latest,
      catalog: catalog.crops,
      plannedOn: today,
    });

    return {
      plot,
      status: activePlanting ? "aktif" : "kosong",
      activePlanting: activePlanting ?? null,
      lastPlanting: history[0] ?? null,
      latestSoilTest: latest,
      soilReport: latest ? buildSoilReport(latest) : null,
      topRecommendation: analysis.recommendations[0] ?? null,
      harvestLabel: activePlanting
        ? formatRelatif(activePlanting.estimatedHarvestOn ?? today, today)
        : null,
      plantingCount: history.length,
    };
  });
}

/* -------------------------------- dashboard ------------------------------- */

const URGENCY_ORDER = { tinggi: 0, sedang: 1, rendah: 2 } as const;

export async function getDashboard(): Promise<DashboardData> {
  await ensureReady();
  const [allFarms, allPlots, allPlantings, allSoilTests, catalog] = await Promise.all([
    listFarms(),
    listPlots(),
    listPlantings(),
    listSoilTests(),
    getCatalog(),
  ]);

  const today = todayISO();
  const activePlantings = allPlantings
    .filter((item) => !item.harvestedOn && item.plantedOn <= today)
    .sort((a, b) => (a.estimatedHarvestOn ?? "").localeCompare(b.estimatedHarvestOn ?? ""));

  const actions: NextAction[] = [];

  for (const planting of activePlantings) {
    const estimate = planting.estimatedHarvestOn ?? today;
    const daysLeft = daysBetween(today, estimate);
    const cropName = planting.crop?.commonName ?? "Tanaman";
    const plotName = planting.plotName ?? "Petak";
    const base = { plotId: planting.plotId, plotName, href: `/petak/${planting.plotId}` };

    if (daysLeft < 0) {
      actions.push({
        ...base,
        id: `panen-late-${planting.id}`,
        kind: "panen",
        title: `Terlambat panen ${cropName} di ${plotName}`,
        detail: `Perkiraan panen ${formatRelatif(estimate, today)}. Segera panen agar kualitas tidak turun dan bedeng bisa disiapkan untuk rotasi berikutnya.`,
        dueLabel: `Lewat ${Math.abs(daysLeft)} hari`,
        urgency: "tinggi",
      });
    } else if (daysLeft <= 7) {
      actions.push({
        ...base,
        id: `panen-${planting.id}`,
        kind: "panen",
        title: `Waktunya panen ${cropName} di ${plotName}`,
        detail: daysLeft === 0 ? "Perkiraan panen jatuh hari ini. Panen pagi hari saat suhu masih sejuk." : `Perkiraan panen ${formatRelatif(estimate, today)}. Siapkan keranjang dan catatan hasil panen.`,
        dueLabel: daysLeft === 0 ? "Hari ini" : `${daysLeft} hari lagi`,
        urgency: "tinggi",
      });
    } else if (daysLeft <= 21) {
      actions.push({
        ...base,
        id: `panen-soon-${planting.id}`,
        kind: "panen",
        title: `Siapkan panen ${cropName} di ${plotName}`,
        detail: `Perkiraan panen ${formatRelatif(estimate, today)}. Mulai kurangi nitrogen agar tanaman fokus ke buah/umbi.`,
        dueLabel: `${daysLeft} hari lagi`,
        urgency: "sedang",
      });
    }

    if (daysBetween(planting.plantedOn, today) <= 7) {
      actions.push({
        ...base,
        id: `rawat-${planting.id}`,
        kind: "perawatan",
        title: `Pantau ${cropName} baru di ${plotName}`,
        detail: "Fase kritis 7 hari pertama: jaga kelembapan, cek bibit yang gagal tumbuh, dan pantau hama muda.",
        dueLabel: "Minggu ini",
        urgency: "sedang",
      });
    }
  }

  const plotIdsWithActive = new Set(activePlantings.map((item) => item.plotId));

  for (const plot of allPlots) {
    const tests = allSoilTests.filter((test) => test.plotId === plot.id);
    const latest = tests[0];

    if (!latest) {
      actions.push({
        id: `tanah-kosong-${plot.id}`,
        kind: "tanah",
        title: `Lakukan uji tanah ${plot.name}`,
        detail: "Belum ada data pH, N, P, K, dan bahan organik. Rekomendasi rotasi belum bisa menyesuaikan kondisi hara.",
        plotId: plot.id,
        plotName: plot.name,
        dueLabel: "Segera",
        urgency: "sedang",
        href: `/petak/${plot.id}`,
      });
    } else if (soilTestIsStale(latest.testedOn)) {
      actions.push({
        id: `tanah-basi-${plot.id}`,
        kind: "tanah",
        title: `Perbarui uji tanah ${plot.name}`,
        detail: `Uji terakhir ${formatRelatif(latest.testedOn, today)}. Uji ulang agar rekomendasi rotasi tetap akurat.`,
        plotId: plot.id,
        plotName: plot.name,
        dueLabel: formatRelatif(latest.testedOn, today),
        urgency: "rendah",
        href: `/petak/${plot.id}`,
      });
    } else {
      const report = buildSoilReport(latest);
      const phMetric = report.metrics.find((metric) => metric.key === "ph");
      if (phMetric && phMetric.status !== "ideal") {
        actions.push({
          id: `ph-${plot.id}`,
          kind: "tanah",
          title: `Perbaiki pH ${plot.name} (pH ${latest.ph.toFixed(1)})`,
          detail: phMetric.advice,
          plotId: plot.id,
          plotName: plot.name,
          dueLabel: "Sebelum tanam",
          urgency: phMetric.status === "kritis" ? "tinggi" : "sedang",
          href: `/petak/${plot.id}`,
        });
      }
    }

    if (!plotIdsWithActive.has(plot.id)) {
      const history = allPlantings.filter((item) => item.plotId === plot.id);
      const last = history[0];
      actions.push({
        id: `tanam-${plot.id}`,
        kind: "tanam",
        title: `${plot.name} kosong — rencanakan rotasi`,
        detail: last
          ? `Musim sebelumnya ${last.crop?.commonName} (${last.family?.name}). Lihat rekomendasi famili berbeda untuk musim ini.`
          : "Petak belum memiliki riwayat. Rekam penanaman pertama agar mesin rotasi dapat menyusun rencana.",
        plotId: plot.id,
        plotName: plot.name,
        dueLabel: "Musim ini",
        urgency: history.length ? "tinggi" : "sedang",
        href: `/petak/${plot.id}`,
      });
    }
  }

  const pestHistory = allPlantings.filter((item) => item.pestReported).slice(0, 2);
  for (const planting of pestHistory) {
    actions.push({
      id: `hama-${planting.id}`,
      kind: "hama",
      title: `Waspadai jejak hama ${planting.family?.name ?? ""} di ${planting.plotName ?? "petak"}`,
      detail: `${planting.crop?.commonName ?? "Tanaman"} (${planting.plantedOn}) tercatat mengalami gangguan. Jangan ulangi famili yang sama minimal 3 musim.`,
      plotId: planting.plotId,
      plotName: planting.plotName ?? "Petak",
      dueLabel: "Musim depan",
      urgency: "sedang",
      href: `/petak/${planting.plotId}`,
    });
  }

  actions.sort((a, b) => URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency] || a.title.localeCompare(b.title));

  const familyMap = new Map<string, { family: PlantFamily; count: number; area: number }>();
  for (const planting of activePlantings) {
    const family = planting.family;
    if (!family) continue;
    const entry = familyMap.get(family.id) ?? { family, count: 0, area: 0 };
    entry.count += 1;
    entry.area += planting.plot?.area ?? 0;
    familyMap.set(family.id, entry);
  }

  const latestSoilByPlot = new Map<string, SoilTest>();
  for (const test of allSoilTests) {
    if (!latestSoilByPlot.has(test.plotId)) latestSoilByPlot.set(test.plotId, test);
  }

  return {
    counts: {
      farms: allFarms.length,
      plots: allPlots.length,
      activePlantings: activePlantings.length,
      cropsCatalog: catalog.crops.length,
      soilTests: allSoilTests.length,
      totalArea: allPlots.reduce((sum, plot) => sum + plot.area, 0),
    },
    nextActions: actions.slice(0, 10),
    activePlantings: activePlantings,
    familyDistribution: Array.from(familyMap.values()).sort((a, b) => b.count - a.count),
    recentSoilTests: Array.from(latestSoilByPlot.values())
      .sort((a, b) => b.testedOn.localeCompare(a.testedOn))
      .slice(0, 6)
      .map((test) => ({
        ...test,
        plotName: allPlots.find((plot) => plot.id === test.plotId)?.name ?? "Petak",
      })),
    upcomingHarvests: activePlantings.slice(0, 6),
  };
}

export async function getRotationAnalysis(plotId: string, plannedOn = todayISO()) {
  await ensureReady();
  const detail = await getPlotDetail(plotId, plannedOn);
  return detail?.analysis ?? null;
}

export async function validatePlanting(input: {
  plotId: string;
  cropId: string;
  plannedOn?: string;
}) {
  await ensureReady();
  const [plot, catalog] = await Promise.all([getPlot(input.plotId), getCatalog()]);
  const crop = catalog.crops.find((item) => item.id === input.cropId);
  if (!plot || !crop || !crop.family) return null;
  const [history, tests] = await Promise.all([
    listPlantings({ plotId: plot.id }),
    listSoilTests({ plotId: plot.id }),
  ]);
  return checkPlanting({
    history,
    crop,
    family: crop.family,
    catalog: catalog.crops,
    plot,
    soilTest: tests[0] ?? null,
    plannedOn: input.plannedOn ?? todayISO(),
  });
}

export async function countAll() {
  await ensureReady();
  const [farmCount, plotCount, cropCount, plantingCount, soilCount] = await Promise.all([
    db.select({ value: count() }).from(farms),
    db.select({ value: count() }).from(plots),
    db.select({ value: count() }).from(crops),
    db.select({ value: count() }).from(plantings),
    db.select({ value: count() }).from(soilTests),
  ]);
  return {
    farms: Number(farmCount[0]?.value ?? 0),
    plots: Number(plotCount[0]?.value ?? 0),
    crops: Number(cropCount[0]?.value ?? 0),
    plantings: Number(plantingCount[0]?.value ?? 0),
    soilTests: Number(soilCount[0]?.value ?? 0),
  };
}
