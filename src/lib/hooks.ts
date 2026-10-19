"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api-client";

export const queryKeys = {
  dashboard: ["dashboard"] as const,
  farms: ["farms"] as const,
  plots: (farmId?: string) => ["plots", farmId ?? "semua"] as const,
  plot: (id: string) => ["plot-detail", id] as const,
  catalog: ["catalog"] as const,
  plantings: (plotId?: string) => ["plantings", plotId ?? "semua"] as const,
  soilTests: (plotId?: string) => ["soil-tests", plotId ?? "semua"] as const,
  check: (plotId: string, cropId: string) => ["planting-check", plotId, cropId] as const,
};

export function useDashboard() {
  return useQuery({ queryKey: queryKeys.dashboard, queryFn: api.dashboard });
}

export function useFarms() {
  return useQuery({ queryKey: queryKeys.farms, queryFn: api.farms.list });
}

export function usePlots(farmId?: string) {
  return useQuery({
    queryKey: queryKeys.plots(farmId),
    queryFn: () => api.plots.list(farmId),
  });
}

export function usePlotSummaries() {
  return useQuery({ queryKey: ["plot-summaries"], queryFn: api.plots.summaries });
}

export function usePlotDetail(plotId: string) {
  return useQuery({
    queryKey: queryKeys.plot(plotId),
    queryFn: () => api.plots.detail(plotId),
    enabled: Boolean(plotId),
  });
}

export function useCatalog() {
  return useQuery({ queryKey: queryKeys.catalog, queryFn: api.catalog, staleTime: 5 * 60_000 });
}

export function usePlantings(plotId?: string) {
  return useQuery({
    queryKey: queryKeys.plantings(plotId),
    queryFn: () => api.plantings.list(plotId ? { plotId } : undefined),
  });
}

export function useSoilTests(plotId?: string) {
  return useQuery({
    queryKey: queryKeys.soilTests(plotId),
    queryFn: () => api.soilTests.list(plotId ? { plotId } : undefined),
  });
}

function useInvalidator() {
  const client = useQueryClient();
  return () => {
    void client.invalidateQueries({ queryKey: queryKeys.dashboard });
    void client.invalidateQueries({ queryKey: queryKeys.farms });
    void client.invalidateQueries({ queryKey: ["plots"] });
    void client.invalidateQueries({ queryKey: ["plot-detail"] });
    void client.invalidateQueries({ queryKey: ["plantings"] });
    void client.invalidateQueries({ queryKey: ["soil-tests"] });
    void client.invalidateQueries({ queryKey: ["planting-check"] });
  };
}

export function useFarmMutations() {
  const invalidate = useInvalidator();
  return {
    create: useMutation({
      mutationFn: (input: { name: string; location?: string }) => api.farms.create(input),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, ...input }: { id: string; name?: string; location?: string | null }) =>
        api.farms.update(id, input),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: (id: string) => api.farms.remove(id), onSuccess: invalidate }),
  };
}

export function usePlotMutations() {
  const invalidate = useInvalidator();
  return {
    create: useMutation({
      mutationFn: (input: { farmId: string; name: string; area: number; soilType: string; notes?: string }) =>
        api.plots.create(input),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({
        id,
        ...input
      }: { id: string } & Partial<Pick<import("./types").Plot, "name" | "area" | "soilType" | "notes" | "isActive">>) =>
        api.plots.update(id, input),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: (id: string) => api.plots.remove(id), onSuccess: invalidate }),
  };
}

export function usePlantingMutations() {
  const invalidate = useInvalidator();
  return {
    create: useMutation({
      mutationFn: (input: {
        plotId: string;
        cropId: string;
        plantedOn: string;
        harvestedOn?: string | null;
        notes?: string;
        pestReported?: boolean;
      }) => api.plantings.create(input),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({
        id,
        ...input
      }: { id: string; harvestedOn?: string | null; notes?: string | null; pestReported?: boolean }) =>
        api.plantings.update(id, input),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: (id: string) => api.plantings.remove(id), onSuccess: invalidate }),
  };
}

export function useSoilTestMutations() {
  const invalidate = useInvalidator();
  return {
    create: useMutation({
      mutationFn: (input: {
        plotId: string;
        testedOn: string;
        ph: number;
        n: number;
        p: number;
        k: number;
        organicMatter: number;
        notes?: string;
      }) => api.soilTests.create(input),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: (id: string) => api.soilTests.remove(id), onSuccess: invalidate }),
  };
}

/** Validasi rotasi langsung saat pengguna memilih tanaman pada formulir. */
export function usePlantingCheck(plotId: string, cropId: string, plannedOn?: string) {
  return useQuery({
    queryKey: [...queryKeys.check(plotId, cropId), plannedOn ?? "hari-ini"],
    queryFn: () => api.validatePlanting({ plotId, cropId, plannedOn }),
    enabled: Boolean(plotId) && Boolean(cropId),
    staleTime: 20_000,
  });
}
