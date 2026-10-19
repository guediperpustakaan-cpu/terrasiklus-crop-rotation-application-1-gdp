/** Helper kecil untuk route handler API. */

export function ok<T>(data: T, status = 200): Response {
  return Response.json({ data }, { status });
}

export function fail(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new Error("Body permintaan bukan JSON yang valid.");
  }
}

export function isBlank(value: unknown): value is null | undefined {
  return value === null || value === undefined || (typeof value === "string" && value.trim() === "");
}

export function isISODate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function isUUID(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function handleRouteError(error: unknown): Response {
  const message = error instanceof Error ? error.message : "Terjadi kesalahan pada server.";
  console.error("[TerraSiklus API]", message);
  return fail(message, 500);
}
