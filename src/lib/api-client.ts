import type {
  CatalogResponse,
  DashboardData,
  Farm,
  Planting,
  PlantingCheck,
  Plot,
  PlotDetail,
  PlotSummary,
  Profile,
  RotationAnalysis,
  SoilTest,
} from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });

  let payload: { data?: T; error?: string } | null = null;
  try {
    payload = (await response.json()) as { data?: T; error?: string };
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.error ?? `Permintaan gagal dengan status ${response.status}.`);
  }
  if (!payload || payload.data === undefined) {
    throw new Error("Respons server tidak memiliki data.");
  }
  return payload.data;
}

export const api = {
  bootstrap: () => request<{ owner: Profile; counts: Record<string, number>; ready: boolean }>("/api/bootstrap"),
  dashboard: () => request<DashboardData>("/api/dashboard"),
  catalog: () => request<CatalogResponse>("/api/crops"),

  farms: {
    list: () => request<Farm[]>("/api/farms"),
    create: (input: { name: string; location?: string }) =>
      request<Farm>("/api/farms", { method: "POST", body: JSON.stringify(input) }),
    update: (id: string, input: { name?: string; location?: string | null }) =>
      request<Farm>(`/api/farms/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    remove: (id: string) => request<{ id: string }>(`/api/farms/${id}`, { method: "DELETE" }),
  },

  plots: {
    list: (farmId?: string) => request<Plot[]>(`/api/plots${farmId ? `?farmId=${farmId}` : ""}`),
    summaries: () => request<PlotSummary[]>("/api/plots?view=cards"),
    detail: (id: string, plannedOn?: string) =>
      request<PlotDetail>(`/api/plots/${id}${plannedOn ? `?plannedOn=${plannedOn}` : ""}`),
    create: (input: { farmId: string; name: string; area: number; soilType: string; notes?: string }) =>
      request<Plot>("/api/plots", { method: "POST", body: JSON.stringify(input) }),
    update: (id: string, input: Partial<Pick<Plot, "name" | "area" | "soilType" | "notes" | "isActive">>) =>
      request<Plot>(`/api/plots/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    remove: (id: string) => request<{ id: string }>(`/api/plots/${id}`, { method: "DELETE" }),
  },

  plantings: {
    list: (filter?: { plotId?: string; farmId?: string; limit?: number }) => {
      const params = new URLSearchParams();
      if (filter?.plotId) params.set("plotId", filter.plotId);
      if (filter?.farmId) params.set("farmId", filter.farmId);
      if (filter?.limit) params.set("limit", String(filter.limit));
      const query = params.toString();
      return request<Planting[]>(`/api/plantings${query ? `?${query}` : ""}`);
    },
    create: (input: {
      plotId: string;
      cropId: string;
      plantedOn: string;
      harvestedOn?: string | null;
      notes?: string;
      pestReported?: boolean;
    }) =>
      request<{ planting: Planting; check: PlantingCheck | null }>("/api/plantings", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    update: (
      id: string,
      input: { plantedOn?: string; harvestedOn?: string | null; notes?: string | null; pestReported?: boolean },
    ) => request<Planting>(`/api/plantings/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    remove: (id: string) => request<{ id: string }>(`/api/plantings/${id}`, { method: "DELETE" }),
  },

  soilTests: {
    list: (filter?: { plotId?: string; limit?: number }) => {
      const params = new URLSearchParams();
      if (filter?.plotId) params.set("plotId", filter.plotId);
      if (filter?.limit) params.set("limit", String(filter.limit));
      const query = params.toString();
      return request<SoilTest[]>(`/api/soil-tests${query ? `?${query}` : ""}`);
    },
    create: (input: {
      plotId: string;
      testedOn: string;
      ph: number;
      n: number;
      p: number;
      k: number;
      organicMatter: number;
      notes?: string;
    }) => request<SoilTest>("/api/soil-tests", { method: "POST", body: JSON.stringify(input) }),
    remove: (id: string) => request<{ id: string }>(`/api/soil-tests/${id}`, { method: "DELETE" }),
  },

  recommendations: (plotId: string, plannedOn?: string) =>
    request<RotationAnalysis>(
      `/api/recommendations?plotId=${plotId}${plannedOn ? `&plannedOn=${plannedOn}` : ""}`,
    ),

  validatePlanting: (input: { plotId: string; cropId: string; plannedOn?: string }) =>
    request<PlantingCheck>("/api/validate-planting", { method: "POST", body: JSON.stringify(input) }),
};
