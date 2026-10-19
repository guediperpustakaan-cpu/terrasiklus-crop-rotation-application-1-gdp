import { countAll, getOrCreateOwner } from "@/db/queries";
import { handleRouteError, ok } from "@/lib/api-server";

export const dynamic = "force-dynamic";

/** GET /api/bootstrap → memastikan skema & data referensi siap, lalu mengembalikan status basis data. */
export async function GET() {
  try {
    const owner = await getOrCreateOwner();
    const counts = await countAll();
    return ok({ owner, counts, ready: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
