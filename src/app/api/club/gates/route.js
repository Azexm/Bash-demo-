import { requireRole } from "@/lib/roles";
import { createGate, listGates } from "@/lib/staffStore";
import { fail, ok, route } from "@/lib/http";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const GET = route(async (req) => {
    const { user, error } = await requireRole(req, ["club_admin"]);
    if (error) return error;
    return ok(await listGates(user.club_id));
});

// Create a gate account for this club: { name, email, password }
export const POST = route(async (req) => {
    const { user, error } = await requireRole(req, ["club_admin"]);
    if (error) return error;
    const b = await req.json().catch(() => ({}));
    const name = String(b.name ?? "").trim().slice(0, 80);
    const email = String(b.email ?? "").trim().toLowerCase().slice(0, 200);
    const password = String(b.password ?? "");
    if (!name) return fail("Gate name is required");
    if (!EMAIL_RE.test(email)) return fail("Enter a valid email address");
    if (password.length < 6) return fail("Password must be at least 6 characters");

    const gate = await createGate({ clubId: user.club_id, name, email, password });
    if (!gate) return fail("This email is already registered", 409);
    return ok({ id: gate.id, name: gate.name, email: gate.email }, 201);
});
