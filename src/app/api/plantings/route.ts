import { createPlanting, listPlantings, validatePlanting } from "@/db/queries";
import { fail, handleRouteError, isISODate, isUUID, ok, readJson } from "@/lib/api-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const plotId = url.searchParams.get("plotId") ?? undefined;
    const farmId = url.searchParams.get("farmId") ?? undefined;
    const limit = Number(url.searchParams.get("limit") ?? 0) || undefined;
    if (plotId && !isUUID(plotId)) return fail("ID petak tidak valid.");
    if (farmId && !isUUID(farmId)) return fail("ID kebun tidak valid.");
    return ok(await listPlantings({ plotId, farmId, limit }));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJson<{
      plotId?: string;
      cropId?: string;
      plantedOn?: string;
      harvestedOn?: string | null;
      notes?: string;
      pestReported?: boolean;
    }>(request);

    if (!isUUID(body.plotId)) return fail("Petak tidak valid.");
    if (!isUUID(body.cropId)) return fail("Tanaman tidak valid.");
    if (!isISODate(body.plantedOn)) return fail("Tanggal tanam wajib diisi (format YYYY-MM-DD).");
    if (body.harvestedOn && !isISODate(body.harvestedOn)) return fail("Tanggal panen tidak valid.");
    if (body.harvestedOn && body.harvestedOn < body.plantedOn) {
      return fail("Tanggal panen tidak boleh lebih awal dari tanggal tanam.");
    }
    if (body.notes && body.notes.length > 2000) return fail("Catatan maksimal 2000 karakter.");

    const check = await validatePlanting({
      plotId: body.plotId,
      cropId: body.cropId,
      plannedOn: body.plantedOn,
    });

    const planting = await createPlanting({
      plotId: body.plotId,
      cropId: body.cropId,
      plantedOn: body.plantedOn,
      harvestedOn: body.harvestedOn ?? null,
      notes: body.notes?.trim() || null,
      pestReported: body.pestReported ?? false,
    });

    return ok({ planting, check }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
