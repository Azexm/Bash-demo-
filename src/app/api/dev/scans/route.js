import { requireRole } from "@/lib/roles";
import { listAllScans } from "@/lib/devStore";
import { ok, route } from "@/lib/http";

export const dynamic = "force-dynamic";

// Developer: every QR scan and gate decision across all clubs.
export const GET = route(async (req) => {
    const { error } = await requireRole(req, ["developer"]);
    if (error) return error;
    return ok(await listAllScans());
});
