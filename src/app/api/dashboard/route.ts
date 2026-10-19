import { getDashboard } from "@/db/queries";
import { handleRouteError, ok } from "@/lib/api-server";

export const dynamic = "force-dynamic";

/** GET /api/dashboard → ringkasan kebun, tanaman aktif, dan daftar aksi berikutnya. */
export async function GET() {
  try {
    return ok(await getDashboard());
  } catch (error) {
    return handleRouteError(error);
  }
}
