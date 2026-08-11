import { sql } from "drizzle-orm";
import { readDb } from "@/db/index";

export const dynamic = "force-dynamic";

const responseHeaders = {
  "Cache-Control": "no-store, max-age=0",
  "Content-Type": "application/json; charset=utf-8",
};

export async function GET() {
  const startedAt = Date.now();

  try {
    await readDb((db) => db.execute(sql`select 1 as ready`));

    return Response.json(
      {
        status: "ok",
        checks: {
          application: "ok",
          database: "ok",
        },
        responseTimeMs: Date.now() - startedAt,
      },
      { headers: responseHeaders },
    );
  } catch {
    return Response.json(
      {
        status: "degraded",
        checks: {
          application: "ok",
          database: "error",
        },
        responseTimeMs: Date.now() - startedAt,
      },
      { status: 503, headers: responseHeaders },
    );
  }
}
