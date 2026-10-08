import { requireRole } from "@/lib/roles";
import { removeGate } from "@/lib/staffStore";
import { fail, ok, route } from "@/lib/http";

export const dynamic = "force-dynamic";

// Remove a gate account: it becomes a normal user and loses scanner access.
export const DELETE = route(async (req, { params }) => {
    const { user, error } = await requireRole(req, ["club_admin"]);
    if (error) return error;
    if (!(await removeGate(params.id, user.club_id))) return fail("Gate account not found", 404);
    return ok({ removed: true });
});
