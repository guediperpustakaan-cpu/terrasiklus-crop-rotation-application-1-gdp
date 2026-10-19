import { createPlot, listPlotSummaries, listPlots } from "@/db/queries";
import { fail, handleRouteError, isBlank, isUUID, ok, readJson } from "@/lib/api-server";
import { SOIL_TYPES } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * GET /api/plots            → daftar petak sederhana
 * GET /api/plots?view=cards → daftar petak lengkap dengan status, uji tanah, dan rekomendasi teratas
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const farmId = url.searchParams.get("farmId") ?? undefined;
    const view = url.searchParams.get("view") ?? undefined;
    if (farmId && !isUUID(farmId)) return fail("ID kebun tidak valid.");
    if (view === "cards") return ok(await listPlotSummaries());
    return ok(await listPlots(farmId));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJson<{
      farmId?: string;
      name?: string;
      area?: number | string;
      soilType?: string;
      notes?: string;
    }>(request);

    if (!isUUID(body.farmId)) return fail("Pilih kebun tempat petak dibuat.");
    if (isBlank(body.name)) return fail("Nama petak wajib diisi.");

    const area = Number(body.area ?? 0);
    if (!Number.isFinite(area) || area <= 0 || area > 100000) return fail("Luas petak harus angka antara 0–100.000 m².");

    const soilType = (body.soilType ?? "lempung").trim().toLowerCase();
    if (!SOIL_TYPES.some((item) => item.value === soilType)) return fail("Tipe tanah tidak dikenali.");

    const plot = await createPlot({
      farmId: body.farmId,
      name: body.name!.trim(),
      area,
      soilType,
      notes: body.notes?.trim() || null,
    });
    return ok(plot, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
