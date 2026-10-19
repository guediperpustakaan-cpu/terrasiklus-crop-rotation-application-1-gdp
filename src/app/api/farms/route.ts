import { createFarm, listFarms } from "@/db/queries";
import { fail, handleRouteError, isBlank, ok, readJson } from "@/lib/api-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok(await listFarms());
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJson<{ name?: string; location?: string }>(request);
    if (isBlank(body.name)) return fail("Nama kebun wajib diisi.");
    if (body.name!.length > 140) return fail("Nama kebun maksimal 140 karakter.");
    const farm = await createFarm({ name: body.name!.trim(), location: body.location?.trim() || null });
    return ok(farm, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
