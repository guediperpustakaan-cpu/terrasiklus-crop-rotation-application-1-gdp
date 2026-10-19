import { deleteSoilTest } from "@/db/queries";
import { fail, handleRouteError, isUUID, ok } from "@/lib/api-server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    if (!isUUID(id)) return fail("ID uji tanah tidak valid.");
    await deleteSoilTest(id);
    return ok({ id });
  } catch (error) {
    return handleRouteError(error);
  }
}
