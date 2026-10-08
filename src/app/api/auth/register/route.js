import { NextResponse } from "next/server";
import { createUser, publicUser, signToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function handle(req) {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name ?? "").trim().slice(0, 80);
    const email = String(body.email ?? "").trim().toLowerCase().slice(0, 200);
    const password = String(body.password ?? "");

    if (!name) return NextResponse.json({ detail: "Name is required" }, { status: 422 });
    if (!EMAIL_RE.test(email)) return NextResponse.json({ detail: "Enter a valid email address" }, { status: 422 });
    if (password.length < 6 || password.length > 200)
        return NextResponse.json({ detail: "Password must be at least 6 characters" }, { status: 422 });

    const user = await createUser({ name, email, password });
    if (!user) return NextResponse.json({ detail: "This email is already registered" }, { status: 409 });

    return NextResponse.json({ token: await signToken(user.id), user: publicUser(user) });
}

export async function POST(req) {
    try {
        return await handle(req);
    } catch (e) {
        console.error("register failed:", e);
        return NextResponse.json(
            { detail: "Server error: " + (e?.message || "unknown") + " (check /api/health)" },
            { status: 500 },
        );
    }
}
