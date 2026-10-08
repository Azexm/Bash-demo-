import { NextResponse } from "next/server";
import {
    clearFailures,
    findUserByEmail,
    isThrottled,
    publicUser,
    recordFailure,
    signToken,
    verifyPassword,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

async function handle(req) {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase().slice(0, 200);
    const password = String(body.password ?? "").slice(0, 200);

    if (await isThrottled(email)) {
        return NextResponse.json(
            { detail: "Too many failed attempts. Try again in a few minutes." },
            { status: 429 },
        );
    }

    const user = email ? await findUserByEmail(email) : null;
    const ok = user && (await verifyPassword(password, user.password_hash));
    if (!ok) {
        await recordFailure(email);
        return NextResponse.json({ detail: "Invalid email or password" }, { status: 401 });
    }

    await clearFailures(email);
    return NextResponse.json({ token: await signToken(user.id), user: publicUser(user) });
}

export async function POST(req) {
    try {
        return await handle(req);
    } catch (e) {
        console.error("login failed:", e);
        return NextResponse.json(
            { detail: "Server error: " + (e?.message || "unknown") + " (check /api/health)" },
            { status: 500 },
        );
    }
}
