import { ok } from "@/lib/api-response";
import { prisma } from "@/lib/db";

export async function GET() {
  let database = "unknown";

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "ok";
  } catch {
    database = "error";
  }

  return ok({
    status: "ok",
    database,
    timestamp: new Date().toISOString(),
  });
}
