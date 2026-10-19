import { getRotationAnalysis } from "@/db/queries";
import { fail, handleRouteError, isISODate, isUUID, ok } from "@/lib/api-server";

export const dynamic = "force-dynamic";

/**
 * GET /api/recommendations?plotId=...&plannedOn=YYYY-MM-DD
 * Mesin rekomendasi rotasi: tanaman yang disarankan, tanaman yang harus dihindari,
 * peringatan, dan rencana siklus 4 musim ke depan.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const plotId = url.searchParams.get("plotId");
    const plannedOn = url.searchParams.get("plannedOn") ?? undefined;

    if (!isUUID(plotId)) return fail("Parameter plotId wajib berupa UUID.");
    if (plannedOn && !isISODate(plannedOn)) return fail("Parameter plannedOn harus berformat YYYY-MM-DD.");

    const analysis = await getRotationAnalysis(plotId, plannedOn);
    if (!analysis) return fail("Petak tidak ditemukan.", 404);
    return ok(analysis);
  } catch (error) {
    return handleRouteError(error);
  }
}
