import { NextResponse } from "next/server";
import { sql, ensureReady } from "@/lib/db";

export const dynamic = "force-dynamic";

// Visit /api/health after deploying to see what is misconfigured. Never exposes secret values.
export async function GET() {
    const checks = {
        DATABASE_URL: Boolean(process.env.DATABASE_URL),
        AUTH_SECRET: Boolean(process.env.AUTH_SECRET),
        database: "not checked",
    };
    if (checks.DATABASE_URL) {
        try {
            await ensureReady();
            const rows = await sql`SELECT count(*)::int AS users FROM users`;
            checks.database = `ok (${rows[0].users} users)`;
        } catch (e) {
            checks.database = `error: ${e.message}`;
        }
    }
    const ok = checks.DATABASE_URL && checks.AUTH_SECRET && checks.database.startsWith("ok");
    return NextResponse.json(checks, { status: ok ? 200 : 500 });
}
