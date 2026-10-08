import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { listBookingsForUser } from "@/lib/bookingStore";

export const dynamic = "force-dynamic";

export async function GET(req) {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
    return NextResponse.json(await listBookingsForUser(user.id));
}
