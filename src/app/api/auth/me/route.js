import { NextResponse } from "next/server";
import { getUserFromRequest, publicUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req) {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
    return NextResponse.json(publicUser(user));
}
