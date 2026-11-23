/**
 * Liveness probe consumed by the compose `site` healthcheck.
 *
 * @returns A 200 JSON response with `{ ok: true }`; the handler has no
 * dependencies, so it works even while the catalog is still being built.
 */
export function GET() {
  return Response.json({ ok: true });
}
