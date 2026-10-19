import { createSoilTest, listSoilTests } from "@/db/queries";
import { fail, handleRouteError, isISODate, isUUID, ok, readJson } from "@/lib/api-server";

export const dynamic = "force-dynamic";

type NumericField = { key: "ph" | "n" | "p" | "k" | "organicMatter"; label: string; min: number; max: number };

const FIELDS: NumericField[] = [
  { key: "ph", label: "pH", min: 0, max: 14 },
  { key: "n", label: "Nitrogen (N)", min: 0, max: 500 },
  { key: "p", label: "Fosfor (P)", min: 0, max: 500 },
  { key: "k", label: "Kalium (K)", min: 0, max: 1000 },
  { key: "organicMatter", label: "Bahan organik", min: 0, max: 100 },
];

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const plotId = url.searchParams.get("plotId") ?? undefined;
    const limit = Number(url.searchParams.get("limit") ?? 0) || undefined;
    if (plotId && !isUUID(plotId)) return fail("ID petak tidak valid.");
    return ok(await listSoilTests({ plotId, limit }));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJson<Record<string, unknown>>(request);

    if (!isUUID(body.plotId)) return fail("Petak tidak valid.");
    if (!isISODate(body.testedOn)) return fail("Tanggal uji wajib diisi (format YYYY-MM-DD).");

    const values: Record<NumericField["key"], number> = { ph: 0, n: 0, p: 0, k: 0, organicMatter: 0 };
    for (const field of FIELDS) {
      const parsed = Number(body[field.key]);
      if (!Number.isFinite(parsed)) return fail(`${field.label} harus berupa angka.`);
      if (parsed < field.min || parsed > field.max) {
        return fail(`${field.label} harus di antara ${field.min} dan ${field.max}.`);
      }
      values[field.key] = parsed;
    }

    const notes = typeof body.notes === "string" ? body.notes.trim() : "";
    if (notes.length > 2000) return fail("Catatan maksimal 2000 karakter.");

    const test = await createSoilTest({
      plotId: body.plotId as string,
      testedOn: body.testedOn as string,
      ...values,
      notes: notes || null,
    });

    return ok(test, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
