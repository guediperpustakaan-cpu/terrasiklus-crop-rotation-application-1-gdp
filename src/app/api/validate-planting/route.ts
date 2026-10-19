import { validatePlanting } from "@/db/queries";
import { fail, handleRouteError, isISODate, isUUID, ok, readJson } from "@/lib/api-server";

export const dynamic = "force-dynamic";

/** POST /api/validate-planting → peringatan rotasi sebelum pengguna menyimpan catatan tanam. */
export async function POST(request: Request) {
  try {
    const body = await readJson<{ plotId?: string; cropId?: string; plannedOn?: string }>(request);
    if (!isUUID(body.plotId)) return fail("Petak tidak valid.");
    if (!isUUID(body.cropId)) return fail("Tanaman tidak valid.");
    if (body.plannedOn && !isISODate(body.plannedOn)) return fail("Tanggal rencana tidak valid.");

    const check = await validatePlanting(body as { plotId: string; cropId: string; plannedOn?: string });
    if (!check) return fail("Data tanaman atau petak tidak ditemukan.", 404);
    return ok(check);
  } catch (error) {
    return handleRouteError(error);
  }
}
