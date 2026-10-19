import { deletePlanting, updatePlanting } from "@/db/queries";
import { fail, handleRouteError, isISODate, isUUID, ok, readJson } from "@/lib/api-server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    if (!isUUID(id)) return fail("ID catatan tanam tidak valid.");
    const body = await readJson<{
      plantedOn?: string;
      harvestedOn?: string | null;
      notes?: string | null;
      pestReported?: boolean;
      cropId?: string;
    }>(request);

    if (body.plantedOn !== undefined && !isISODate(body.plantedOn)) return fail("Tanggal tanam tidak valid.");
    if (body.harvestedOn !== undefined && body.harvestedOn !== null && !isISODate(body.harvestedOn)) {
      return fail("Tanggal panen tidak valid.");
    }
    if (body.cropId !== undefined && !isUUID(body.cropId)) return fail("Tanaman tidak valid.");

    const planting = await updatePlanting(id, body);
    if (!planting) return fail("Catatan tanam tidak ditemukan.", 404);
    return ok(planting);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    if (!isUUID(id)) return fail("ID catatan tanam tidak valid.");
    await deletePlanting(id);
    return ok({ id });
  } catch (error) {
    return handleRouteError(error);
  }
}
