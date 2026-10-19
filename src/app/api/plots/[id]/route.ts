import { deletePlot, getPlotDetail, updatePlot } from "@/db/queries";
import { fail, handleRouteError, isBlank, isUUID, ok, readJson } from "@/lib/api-server";
import { SOIL_TYPES } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** GET /api/plots/:id → detail petak lengkap dengan riwayat, uji tanah, dan analisis rotasi. */
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    if (!isUUID(id)) return fail("ID petak tidak valid.");
    const plannedOn = new URL(request.url).searchParams.get("plannedOn") ?? undefined;
    const detail = await getPlotDetail(id, plannedOn);
    if (!detail) return fail("Petak tidak ditemukan.", 404);
    return ok(detail);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    if (!isUUID(id)) return fail("ID petak tidak valid.");
    const body = await readJson<{
      name?: string;
      area?: number;
      soilType?: string;
      notes?: string | null;
      isActive?: boolean;
    }>(request);

    if (body.name !== undefined && isBlank(body.name)) return fail("Nama petak tidak boleh kosong.");
    if (body.area !== undefined && (!Number.isFinite(body.area) || body.area <= 0)) return fail("Luas petak harus lebih dari 0.");
    if (body.soilType !== undefined && !SOIL_TYPES.some((item) => item.value === body.soilType)) {
      return fail("Tipe tanah tidak dikenali.");
    }

    const plot = await updatePlot(id, body);
    if (!plot) return fail("Petak tidak ditemukan.", 404);
    return ok(plot);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    if (!isUUID(id)) return fail("ID petak tidak valid.");
    await deletePlot(id);
    return ok({ id });
  } catch (error) {
    return handleRouteError(error);
  }
}
