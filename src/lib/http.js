// Server-only response helpers. Every API route wraps its handler in route() so
// store errors turn into a readable { detail } response instead of a crash.
import { NextResponse } from "next/server";
import { BookingError } from "@/lib/bookingStore";

export const ok = (data, status = 200) => NextResponse.json(data, { status });
export const fail = (detail, status = 422) => NextResponse.json({ detail }, { status });

export function route(fn) {
    return async (req, ctx) => {
        try {
            return await fn(req, ctx);
        } catch (e) {
            if (e instanceof BookingError) return fail(e.message, e.status);
            console.error("API error:", e);
            return fail(e?.message || "Server error", 500);
        }
    };
}
