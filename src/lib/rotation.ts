import type {
  Crop,
  FamilyRole,
  NutrientDemand,
  PlantFamily,
  Planting,
  PlantingCheck,
  Recommendation,
  RotationAlert,
  RotationAnalysis,
  RotationStep,
  SoilTest,
  Verdict,
  Plot,
} from "./types";
import { addDaysISO, daysBetween, formatRelatif, musimLabel, todayISO } from "./utils";

/** Jeda minimum (dalam jumlah musim tanam) sebelum keluarga yang sama boleh dipakai lagi. */
export const MIN_SEASONS_GAP = 3;

export const NUTRIENT_LABEL: Record<NutrientDemand, string> = {
  high: "Tinggi",
  medium: "Sedang",
  low: "Rendah",
};

export const NUTRIENT_BADGE: Record<NutrientDemand, string> = {
  high: "bg-clay-100 text-clay-800 ring-clay-300",
  medium: "bg-amber-100 text-amber-800 ring-amber-300",
  low: "bg-leaf-100 text-leaf-800 ring-leaf-300",
};

export const ROLE_LABEL: Record<FamilyRole, string> = {
  heavy: "Pemakan berat",
  fixer: "Penambat nitrogen",
  light: "Pemakan ringan",
  root: "Umbi & akar",
  allium: "Bawang-bawangan",
  aromatic: "Aromatik pengusir hama",
  cover: "Penutup tanah",
};

/**
 * Bonus transisi peran famili dari musim sebelumnya ke musim berikutnya.
 * Contoh: setelah pemakan berat (heavy) sebaiknya diikuti penambat nitrogen (fixer).
 */
export const ROLE_TRANSITION: Record<FamilyRole, Partial<Record<FamilyRole, number>>> = {
  heavy: { fixer: 14, root: 7, light: 6, allium: 5, aromatic: 3, cover: 2, heavy: 0 },
  fixer: { heavy: 10, root: 7, light: 5, allium: 4, cover: 3, aromatic: 2, fixer: 0 },
  light: { heavy: 6, fixer: 5, root: 5, allium: 3, cover: 3, aromatic: 2, light: 0 },
  root: { heavy: 7, fixer: 6, light: 4, allium: 4, cover: 3, aromatic: 2, root: 0 },
  allium: { heavy: 6, fixer: 6, root: 5, light: 4, aromatic: 3, cover: 2, allium: 0 },
  aromatic: { fixer: 5, heavy: 4, root: 4, light: 4, allium: 3, cover: 3, aromatic: 0 },
  cover: { fixer: 6, root: 5, heavy: 4, light: 4, allium: 3, aromatic: 2, cover: 0 },
};

export const VERDICT_META: Record<
  Verdict,
  { label: string; badge: string; bar: string; dot: string }
> = {
  "sangat-dianjurkan": {
    label: "Sangat dianjurkan",
    badge: "bg-leaf-600 text-white",
    bar: "bg-leaf-600",
    dot: "bg-leaf-600",
  },
  dianjurkan: {
    label: "Dianjurkan",
    badge: "bg-leaf-100 text-leaf-800 ring-1 ring-leaf-300",
    bar: "bg-leaf-500",
    dot: "bg-leaf-500",
  },
  "hati-hati": {
    label: "Hati-hati",
    badge: "bg-amber-100 text-amber-900 ring-1 ring-amber-300",
    bar: "bg-amber-500",
    dot: "bg-amber-500",
  },
  hindari: {
    label: "Hindari",
    badge: "bg-clay-100 text-clay-900 ring-1 ring-clay-300",
    bar: "bg-clay-500",
    dot: "bg-clay-500",
  },
};

export const PEST_KEYWORDS = [
  "hama",
  "ulat",
  "kutu",
  "busuk",
  "layu",
  "bercak",
  "jamur",
  "virus",
  "tungau",
  "penggerek",
  "tikus",
  "nematoda",
  "antraknos",
  "kresek",
  "akar gada",
  "lalat",
];

export function hasPestSignal(planting: Planting): boolean {
  const text = (planting.notes ?? "").toLowerCase();
  return planting.pestReported || PEST_KEYWORDS.some((keyword) => text.includes(keyword));
}

export function verdictOf(score: number): Verdict {
  if (score >= 86) return "sangat-dianjurkan";
  if (score >= 70) return "dianjurkan";
  if (score >= 50) return "hati-hati";
  return "hindari";
}

function sortHistory(history: Planting[]): Planting[] {
  return [...history].sort((a, b) => b.plantedOn.localeCompare(a.plantedOn));
}

export interface RotationInput {
  plot: Plot;
  history: Planting[];
  soilTest: SoilTest | null;
  catalog: Crop[];
  plannedOn?: string;
}

/**
 * Mesin rekomendasi rotasi.
 * Aturan utama: sarankan tanaman dari famili botani yang berbeda dari musim sebelumnya,
 * beri peringatan bila famili yang sama dipakai terlalu cepat, dan jelaskan alasannya.
 */
export function analyzeRotation({
  plot,
  history,
  soilTest,
  catalog,
  plannedOn = todayISO(),
}: RotationInput): RotationAnalysis {
  const historySorted = sortHistory(history).filter((item) => item.plantedOn <= plannedOn);
  const lastPlanting = historySorted[0] ?? null;
  const lastFamily = lastPlanting?.family ?? null;
  const lastCrop = lastPlanting?.crop ?? null;

  const seasonsSinceFamily: Record<string, number> = {};
  historySorted.forEach((item, index) => {
    const familyId = item.family?.id ?? item.crop?.familyId;
    if (familyId && !(familyId in seasonsSinceFamily)) {
      seasonsSinceFamily[familyId] = index;
    }
  });
  const gapOf = (familyId: string) => (familyId in seasonsSinceFamily ? seasonsSinceFamily[familyId] : 99);

  const pestFamilyCount: Record<string, number> = {};
  historySorted.slice(0, 4).forEach((item) => {
    if (hasPestSignal(item) && item.family?.id) {
      pestFamilyCount[item.family.id] = (pestFamilyCount[item.family.id] ?? 0) + 1;
    }
  });

  const scored: Recommendation[] = catalog
    .filter((crop) => crop.family)
    .map((crop) => {
      const family = crop.family as PlantFamily;
      let score = 46;
      const reasons: string[] = [];
      const warnings: string[] = [];
      const gap = gapOf(family.id);

      if (!lastPlanting || !lastFamily) {
        score += 10;
        reasons.push("Petak sedang kosong, sehingga semua famili botani aman dipilih untuk musim ini.");
      } else if (family.id === lastFamily.id) {
        score -= 48;
        warnings.push(
          `${crop.commonName} satu famili (${family.name}) dengan tanaman sebelumnya (${lastCrop?.commonName ?? "musim lalu"}). Keluarga tanaman berbeda untuk mencegah hama.`,
        );
      } else {
        score += 18;
        reasons.push(
          `Keluarga tanaman berbeda untuk mencegah hama: ${family.name} menggantikan ${lastFamily.name} dari musim sebelumnya.`,
        );
      }

      if (gap >= MIN_SEASONS_GAP && lastPlanting) {
        score += gap === 99 ? 10 : 7;
        reasons.push(
          gap === 99
            ? `Famili ${family.name} belum pernah tercatat di riwayat petak ini.`
            : `Famili ${family.name} sudah diistirahatkan ${gap} musim — aman dari penumpukan patogen.`,
        );
      } else if (gap === 2) {
        score += 3;
        reasons.push(`Famili ${family.name} terakhir dipakai 2 musim lalu, mendekati batas aman.`);
      } else if (gap <= 1 && lastPlanting && family.id !== lastFamily?.id) {
        score -= 20;
        warnings.push(
          `Famili ${family.name} masih tercatat pada ${gap + 1} musim terakhir. Beri jeda minimal ${MIN_SEASONS_GAP} musim.`,
        );
      }

      // Urutan peran famili: pemakan berat → penambat nitrogen → umbi/daun → dst.
      if (lastCrop && lastFamily) {
        score += ROLE_TRANSITION[lastFamily.role]?.[family.role] ?? 0;
        if (lastFamily.role === "heavy" && family.role === "fixer") {
          reasons.push(
            `Tanaman penambat nitrogen (${family.label}) memulihkan kesuburan setelah pemakan berat seperti ${lastCrop.commonName}.`,
          );
        } else if (lastFamily.role === "fixer" && family.role === "heavy") {
          reasons.push("Memanfaatkan sisa nitrogen dari musim kacang-kacangan sebelumnya untuk hasil buah yang optimal.");
        } else if (lastFamily.role === "heavy" && (family.role === "root" || family.role === "light")) {
          reasons.push(
            `Setelah pemakan berat, ${family.label} memberi waktu tanah memulihkan unsur hara sebelum musim buah berikutnya.`,
          );
        }
      }
      if (lastCrop && lastCrop.nutrientDemand === "high" && crop.nutrientDemand === "low") {
        score += 6;
        reasons.push("Pemakan ringan memberi jeda pemulihan unsur hara setelah musim boros nutrisi.");
      }
      if (lastCrop && lastCrop.nutrientDemand === "low" && crop.nutrientDemand === "high") {
        score += 5;
        reasons.push("Tanah sudah dipulihkan musim lalu, cocok dimanfaatkan tanaman berkebutuhan hara tinggi.");
      }

      // Kondisi tanah terkini
      if (soilTest) {
        if (soilTest.ph < 5.8) {
          if (family.name === "Brassicaceae") {
            score -= 14;
            warnings.push(
              `pH tanah ${soilTest.ph.toFixed(1)} (asam) memicu akar gada pada kubis-kubisan. Beri dolomit 1–2 kg/10 m² dulu.`,
            );
          }
          if (crop.commonName.toLowerCase().includes("kentang")) {
            warnings.push(`pH rendah meningkatkan risiko keropeng (scab) pada umbi kentang.`);
          }
        }
        if (soilTest.ph > 7.8) {
          score -= 6;
          warnings.push(`pH ${soilTest.ph.toFixed(1)} terlalu alkalis, serap zat besi & fosfor terhambat.`);
        }
        if (soilTest.n < 15) {
          if (family.role === "fixer") {
            score += 11;
            reasons.push(`Nitrogen tanah rendah (${soilTest.n} ppm) — famili ${family.name} akan memperbaikinya.`);
          }
          if (crop.nutrientDemand === "high") {
            score -= 15;
            warnings.push(`Nitrogen ${soilTest.n} ppm terlalu rendah untuk pemakan berat tanpa tambahan kompos.`);
          }
        } else if (soilTest.n > 45 && crop.nutrientDemand === "low") {
          score -= 5;
          warnings.push("Nitrogen berlebih membuat tanaman daun cepat lemas & disukai kutu daun.");
        }
        if (soilTest.p < 10 && (family.name === "Solanaceae" || family.name === "Cucurbitaceae")) {
          score -= 9;
          warnings.push(`Fosfor ${soilTest.p} ppm rendah — pembungaan tanaman buah bisa terhambat.`);
        }
        if (soilTest.k < 100 && (family.name === "Solanaceae" || family.name === "Cucurbitaceae")) {
          score -= 6;
          warnings.push(`Kalium ${soilTest.k} ppm rendah, buah cenderung kecil dan tanaman mudah rebah.`);
        }
        if (soilTest.organicMatter < 2) {
          if (crop.nutrientDemand === "high") {
            score -= 11;
            warnings.push(
              `Bahan organik ${soilTest.organicMatter}% sangat rendah — pemakan berat butuh 2–4 kg kompos/m².`,
            );
          }
          if (family.role === "cover" || family.role === "fixer") {
            score += 8;
            reasons.push("Membangun bahan organik tanah yang masih rendah sebelum kembali ke tanaman produktif.");
          }
        }
      } else {
        warnings.push("Belum ada data uji tanah untuk petak ini, rekomendasi belum mempertimbangkan hara.");
      }

      // Karakter tanah petak
      if (plot.soilType === "berpasir" && crop.nutrientDemand === "high") {
        score -= 5;
        warnings.push("Tanah berpasir cepat meloloskan hara — pemakan berat perlu mulsa & kompos ekstra.");
      }
      if (plot.soilType === "liat" && family.role === "root") {
        score -= 7;
        warnings.push("Tanah liat padat menghambat perkembangan umbi; campur kompos/pasir sebelum tanam.");
      }
      if (plot.soilType === "gambut" && soilTest && soilTest.ph < 5) {
        score -= 4;
        warnings.push("Tanah gambut sangat asam — prioritaskan pengapuran.");
      }

      // Riwayat hama
      const pestCount = pestFamilyCount[family.id] ?? 0;
      if (pestCount > 0) {
        score -= 20;
        warnings.push(
          `Riwayat hama/penyakit tercatat pada famili ${family.name} dalam ${pestCount} musim terakhir. Jeda minimal ${MIN_SEASONS_GAP} musim.`,
        );
      }

      // Aromatik sebagai tanaman pendamping pemutus hama
      if (family.role === "aromatic" && pestCount > 0) {
        score += 4;
        reasons.push("Tanaman aromatik membantu mengusir hama yang pernah menyerang petak ini.");
      }

      const finalScore = Math.max(3, Math.min(99, Math.round(score)));

      return {
        crop,
        family,
        score: finalScore,
        verdict: verdictOf(finalScore),
        reasons: reasons.slice(0, 3),
        warnings: warnings.slice(0, 3),
        estimatedHarvestOn: addDaysISO(plannedOn, crop.harvestDays),
      };
    });

  const ranked = [...scored].sort(
    (a, b) =>
      b.score - a.score ||
      gapOf(b.family.id) - gapOf(a.family.id) ||
      a.crop.commonName.localeCompare(b.crop.commonName),
  );

  // Satu wakil terbaik tiap famili lebih dulu, lalu sisanya — agar saran tetap beragam.
  const eligible = ranked.filter((item) => item.verdict !== "hindari");
  const familyBest = new Map<string, Recommendation>();
  for (const item of eligible) {
    if (!familyBest.has(item.family.id)) familyBest.set(item.family.id, item);
  }
  const leaders = Array.from(familyBest.values())
    .sort((a, b) => b.score - a.score || a.crop.commonName.localeCompare(b.crop.commonName))
    .slice(0, 6);
  const leaderIds = new Set(leaders.map((item) => item.crop.id));
  const fillers = eligible.filter((item) => !leaderIds.has(item.crop.id)).slice(0, Math.max(0, 9 - leaders.length));
  const recommendations = [...leaders, ...fillers].sort((a, b) => b.score - a.score || a.crop.commonName.localeCompare(b.crop.commonName));

  const avoid = ranked
    .filter((item) => item.verdict === "hindari")
    .sort((a, b) => a.score - b.score || a.crop.commonName.localeCompare(b.crop.commonName))
    .slice(0, 4);

  // Rencana siklus 4 musim ke depan
  const families = Array.from(
    new Map(catalog.filter((crop) => crop.family).map((crop) => [crop.family!.id, crop.family!])).values(),
  ).sort((a, b) => a.rotationOrder - b.rotationOrder || a.name.localeCompare(b.name));

  const cyclePlan: RotationStep[] = [];
  const usedInCycle = new Set<string>();
  let cursor = lastFamily ? families.findIndex((family) => family.id === lastFamily.id) : -1;
  for (let season = 1; season <= 4 && families.length > 0; season += 1) {
    let chosen: PlantFamily | null = null;
    for (let step = 1; step <= families.length; step += 1) {
      const candidate = families[(cursor + step) % families.length];
      if (candidate && !usedInCycle.has(candidate.id)) {
        chosen = candidate;
        break;
      }
    }
    if (!chosen) {
      chosen = families.sort((a, b) => gapOf(b.id) - gapOf(a.id))[0] ?? families[0];
    }
    usedInCycle.add(chosen.id);
    cursor = families.findIndex((family) => family.id === chosen!.id);

    const best = ranked.find((item) => item.family.id === chosen!.id);
    const seasonDate = addDaysISO(plannedOn, (season - 1) * 100);
    cyclePlan.push({
      season,
      label: musimLabel(seasonDate),
      family: chosen,
      suggestedCrop: best?.crop ?? null,
      reason:
        season === 1
          ? chosen.role === "fixer"
            ? "Pulihkan nitrogen tanah lebih dulu sebelum kembali ke tanaman buah."
            : chosen.id !== lastFamily?.id
              ? "Famili berbeda memutus siklus hama dari musim sebelumnya."
              : "Lanjutkan pola tanam yang ada."
          : chosen.role === "fixer"
            ? "Sisipkan kacang-kacangan untuk mengembalikan nitrogen."
            : `Jaga jeda ${MIN_SEASONS_GAP} musim sebelum famili ini diulang.`,
    });
  }

  const alerts: RotationAlert[] = [];
  const activePlanting = history.find((item) => !item.harvestedOn && item.plantedOn <= plannedOn);

  if (!historySorted.length) {
    alerts.push({
      level: "aman",
      title: "Petak belum memiliki riwayat tanam",
      detail: "Semua famili botani aman dipilih. Rekam penanaman pertama agar mesin rotasi bisa bekerja di musim berikutnya.",
    });
  }
  if (activePlanting) {
    const estimate = addDaysISO(
      activePlanting.plantedOn,
      activePlanting.crop?.harvestDays ?? 70,
    );
    alerts.push({
      level: "aman",
      title: `Masih ada tanaman aktif: ${activePlanting.crop?.commonName ?? "—"}`,
      detail: `Ditanam ${formatRelatif(activePlanting.plantedOn, plannedOn).replace("hari ini", "hari ini")}, perkiraan panen ${formatRelatif(estimate, plannedOn)}.`,
    });
  }
  if (lastPlanting && hasPestSignal(lastPlanting) && lastFamily) {
    alerts.push({
      level: "bahaya",
      title: `Jejak hama pada famili ${lastFamily.name}`,
      detail: `Catatan musim terakhir menyebutkan gangguan hama/penyakit. Jangan menanam famili ${lastFamily.name} minimal ${MIN_SEASONS_GAP} musim ke depan.`,
    });
  }
  if (soilTest && soilTest.ph < 5.8) {
    alerts.push({
      level: "peringatan",
      title: `Tanah terlalu asam (pH ${soilTest.ph.toFixed(1)})`,
      detail: "Aplikasikan kapur dolomit 1–2 kg per 10 m², tunggu 4–6 minggu, lalu uji ulang sebelum menanam.",
    });
  }
  if (soilTest && soilTest.organicMatter < 2) {
    alerts.push({
      level: "peringatan",
      title: `Bahan organik rendah (${soilTest.organicMatter}%)`,
      detail: "Tambahkan kompos matang atau tanam tanaman penutup tanah selama satu musim.",
    });
  }
  if (!soilTest) {
    alerts.push({
      level: "peringatan",
      title: "Belum ada hasil uji tanah",
      detail: "Isi data pH, N, P, K, dan bahan organik agar rekomendasi rotasi menyesuaikan kondisi hara petak.",
    });
  }

  const summary = lastFamily && lastCrop
    ? `Musim sebelumnya: ${lastCrop.commonName} (${lastFamily.name}, kebutuhan hara ${lastCrop.nutrientDemand === "high" ? "tinggi" : lastCrop.nutrientDemand === "medium" ? "sedang" : "rendah"}). Prioritaskan famili berbeda${
        lastCrop.nutrientDemand === "high" ? " terutama kacang-kacangan penambat nitrogen" : ""
      }. Hindari mengulang ${lastFamily.name} minimal ${MIN_SEASONS_GAP} musim.`
    : "Petak siap ditanam. Rekam musim pertama lalu biarkan mesin rotasi menyusun rencana musim berikutnya.";

  return {
    plot,
    plannedOn,
    history: historySorted,
    lastPlanting,
    lastFamily,
    recommendations,
    avoid,
    alerts,
    cyclePlan,
    seasonsSinceFamily,
    summary,
  };
}

/** Validasi cepat saat pengguna hendak menanam sesuatu di sebuah petak. */
export function checkPlanting(params: {
  history: Planting[];
  crop: Crop;
  family: PlantFamily;
  catalog: Crop[];
  plot: Plot;
  soilTest: SoilTest | null;
  plannedOn?: string;
}): PlantingCheck {
  const { history, crop, family, catalog, plot, soilTest } = params;
  const plannedOn = params.plannedOn ?? todayISO();
  const analysis = analyzeRotation({ plot, history, soilTest, catalog, plannedOn });
  const historySorted = sortHistory(history).filter((item) => item.plantedOn <= plannedOn);
  const lastPlanting = historySorted[0] ?? null;
  const lastFamily = lastPlanting?.family ?? null;
  const lastCrop = lastPlanting?.crop ?? null;

  const seasonsSince = historySorted.findIndex((item) => item.family?.id === family.id);
  const gap = seasonsSince === -1 ? 99 : seasonsSince;
  const lastUsed = historySorted[seasonsSince];

  let level: PlantingCheck["level"] = "aman";
  const messages: string[] = [];

  if (!lastPlanting) {
    messages.push(
      "Petak belum punya riwayat tanam, jadi penanaman ini aman. Catat tanggal tanam & panen agar rotasi musim depan bisa dihitung.",
    );
  } else if (lastFamily && family.id === lastFamily.id) {
    level = "bahaya";
    messages.push(
      `${crop.commonName} berada dalam famili ${family.name}, sama seperti tanaman sebelumnya (${lastCrop?.commonName}) yang ditanam ${daysBetween(lastPlanting.plantedOn, plannedOn)} hari lalu.`,
    );
    messages.push(
      "Risiko: hama & penyakit khusus famili ini bertahan di tanah dan populasinya meledak, sementara unsur hara yang sama terus terkuras.",
    );
    messages.push(`Solusi: pilih keluarga tanaman berbeda untuk mencegah hama, dengan jeda minimal ${MIN_SEASONS_GAP} musim.`);
  } else if (gap < MIN_SEASONS_GAP) {
    level = "peringatan";
    messages.push(
      `Famili ${family.name} terakhir ditanam ${lastUsed ? formatRelatif(lastUsed.plantedOn, plannedOn) : "baru-baru ini"} — baru ${gap} musim jeda. Jeda ideal minimal ${MIN_SEASONS_GAP} musim agar populasi hama sempat putus.`,
    );
    messages.push("Pertimbangkan menanam famili lain musim ini dan simpan rencana ini untuk musim berikutnya.");
  } else {
    messages.push(
      `Aman: famili ${family.name} berbeda dari musim sebelumnya (${lastFamily?.name ?? "—"}) dan sudah diistirahatkan ${gap === 99 ? "sepanjang riwayat" : `${gap} musim`}.`,
    );
  }

  if (lastPlanting && hasPestSignal(lastPlanting) && lastFamily && lastFamily.id !== family.id && level === "aman") {
    level = "peringatan";
    messages.push(
      `Catatan musim lalu menyebutkan hama/penyakit pada ${lastFamily.name}. Bersihkan sisa tanaman & lakukan rotasi seperti rencana ini.`,
    );
  }

  const matched = analysis.recommendations.find((item) => item.crop.id === crop.id);
  if (matched) {
    matched.warnings.forEach((warning) => messages.push(warning));
    if (matched.verdict === "hindari" && level === "aman") level = "peringatan";
    if (matched.verdict === "hindari" && level === "peringatan" && gap >= MIN_SEASONS_GAP) level = "bahaya";
  }

  const suggestions = analysis.recommendations
    .filter((item) => item.crop.id !== crop.id && item.verdict !== "hindari")
    .slice(0, 4);

  const title =
    level === "bahaya"
      ? `Peringatan: ${crop.commonName} mengulang famili ${family.name} terlalu cepat`
      : level === "peringatan"
        ? `Perhatian: ${crop.commonName} perlu jeda rotasi yang lebih panjang`
        : `Aman: ${crop.commonName} cocok untuk rotasi ${plot.name}`;

  return { level, title, messages, suggestions };
}
