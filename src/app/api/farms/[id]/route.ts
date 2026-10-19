import { deleteFarm, getFarm, updateFarm } from "@/db/queries";
import { fail, handleRouteError, isBlank, isUUID, ok, readJson } from "@/lib/api-server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    if (!isUUID(id)) return fail("ID kebun tidak valid.");
    const farm = await getFarm(id);
    if (!farm) return fail("Kebun tidak ditemukan.", 404);
    return ok(farm);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    if (!isUUID(id)) return fail("ID kebun tidak valid.");
    const body = await readJson<{ name?: string; location?: string | null }>(request);
    if (body.name !== undefined && isBlank(body.name)) return fail("Nama kebun tidak boleh kosong.");
    const farm = await updateFarm(id, {
      name: body.name?.trim(),
      location: body.location === undefined ? undefined : body.location?.trim() || null,
    });
    if (!farm) return fail("Kebun tidak ditemukan.", 404);
    return ok(farm);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    if (!isUUID(id)) return fail("ID kebun tidak valid.");
    await deleteFarm(id);
    return ok({ id });
  } catch (error) {
    return handleRouteError(error);
  }
}
