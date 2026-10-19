import { getCatalog } from "@/db/queries";
import { handleRouteError, ok } from "@/lib/api-server";

export const dynamic = "force-dynamic";

/** GET /api/crops → famili botani + katalog tanaman (data referensi). */
export async function GET() {
  try {
    return ok(await getCatalog());
  } catch (error) {
    return handleRouteError(error);
  }
}
