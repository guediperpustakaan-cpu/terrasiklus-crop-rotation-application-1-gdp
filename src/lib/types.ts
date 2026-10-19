/** Tipe domain TerraSiklus — dipakai bersama oleh API, engine rotasi, dan UI. */

export type NutrientDemand = "high" | "medium" | "low";

export type FamilyRole =
  | "heavy"
  | "fixer"
  | "light"
  | "root"
  | "allium"
  | "aromatic"
  | "cover";

export type Verdict = "sangat-dianjurkan" | "dianjurkan" | "hati-hati" | "hindari";

export type CheckLevel = "aman" | "peringatan" | "bahaya";

export type SoilStatus = "rendah" | "ideal" | "tinggi" | "kritis";

export interface Profile {
  id: string;
  username: string;
  fullName: string | null;
  createdAt: string;
}

export interface Farm {
  id: string;
  ownerId: string;
  name: string;
  location: string | null;
  createdAt: string;
  plotCount?: number;
}

export interface Plot {
  id: string;
  farmId: string;
  farmName?: string;
  name: string;
  area: number;
  soilType: string;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface PlantFamily {
  id: string;
  name: string;
  label: string;
  role: FamilyRole;
  color: string;
  description: string | null;
  rotationOrder: number;
}

export interface Crop {
  id: string;
  commonName: string;
  familyId: string;
  nutrientDemand: NutrientDemand;
  harvestDays: number;
  description: string | null;
  family?: PlantFamily;
}

export interface Planting {
  id: string;
  plotId: string;
  cropId: string;
  plantedOn: string;
  harvestedOn: string | null;
  pestReported: boolean;
  notes: string | null;
  createdAt: string;
  crop?: Crop;
  family?: PlantFamily;
  plot?: Plot;
  plotName?: string;
  /** perkiraan tanggal panen = plantedOn + crop.harvestDays */
  estimatedHarvestOn?: string;
}

export interface SoilTest {
  id: string;
  plotId: string;
  testedOn: string;
  ph: number;
  n: number;
  p: number;
  k: number;
  organicMatter: number;
  notes: string | null;
  createdAt: string;
}

export interface Recommendation {
  crop: Crop;
  family: PlantFamily;
  score: number;
  verdict: Verdict;
  reasons: string[];
  warnings: string[];
  /** estimasi tanggal panen bila ditanam pada tanggal rencana */
  estimatedHarvestOn: string;
}

export interface RotationStep {
  season: number;
  label: string;
  family: PlantFamily;
  suggestedCrop: Crop | null;
  reason: string;
}

export interface RotationAlert {
  level: CheckLevel;
  title: string;
  detail: string;
}

export interface RotationAnalysis {
  plot: Plot;
  plannedOn: string;
  history: Planting[];
  lastPlanting: Planting | null;
  lastFamily: PlantFamily | null;
  recommendations: Recommendation[];
  avoid: Recommendation[];
  alerts: RotationAlert[];
  cyclePlan: RotationStep[];
  seasonsSinceFamily: Record<string, number>;
  summary: string;
}

export interface PlantingCheck {
  level: CheckLevel;
  title: string;
  messages: string[];
  suggestions: Recommendation[];
}

export interface SoilMetric {
  key: "ph" | "n" | "p" | "k" | "organicMatter";
  label: string;
  unit: string;
  value: number;
  status: SoilStatus;
  statusLabel: string;
  advice: string;
  /** 0..100 untuk bar visual */
  ratio: number;
  optimalRange: string;
}

export interface SoilReport {
  test: SoilTest;
  score: number;
  grade: string;
  metrics: SoilMetric[];
  headline: string;
  actions: string[];
}

export interface NextAction {
  id: string;
  kind: "panen" | "tanam" | "tanah" | "hama" | "perawatan";
  title: string;
  detail: string;
  plotId: string;
  plotName: string;
  dueLabel: string;
  urgency: "tinggi" | "sedang" | "rendah";
  href: string;
}

export interface DashboardData {
  counts: {
    farms: number;
    plots: number;
    activePlantings: number;
    cropsCatalog: number;
    soilTests: number;
    totalArea: number;
  };
  nextActions: NextAction[];
  activePlantings: Planting[];
  familyDistribution: { family: PlantFamily; count: number; area: number }[];
  recentSoilTests: (SoilTest & { plotName: string; plotId: string })[];
  upcomingHarvests: Planting[];
}

export interface CatalogResponse {
  families: PlantFamily[];
  crops: Crop[];
}

export interface PlotSummary {
  plot: Plot;
  status: "aktif" | "kosong";
  activePlanting: Planting | null;
  lastPlanting: Planting | null;
  latestSoilTest: SoilTest | null;
  soilReport: SoilReport | null;
  topRecommendation: Recommendation | null;
  harvestLabel: string | null;
  plantingCount: number;
}

export interface PlotDetail {
  plot: Plot;
  farm: Farm;
  history: Planting[];
  soilTests: SoilTest[];
  analysis: RotationAnalysis;
}
