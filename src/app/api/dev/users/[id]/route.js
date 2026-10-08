import { requireRole } from "@/lib/roles";
import { ROLES, setUserRole } from "@/lib/devStore";
import { getClub } from "@/lib/clubStore";
import { fail, ok, route } from "@/lib/http";

export const dynamic = "force-dynamic";

// Developer: change a user's role. club_admin and gate must be linked to a club.
export const PATCH = route(async (req, { params }) => {
    const { user, error } = await requireRole(req, ["developer"]);
    if (error) return error;
    const b = await req.json().catch(() => ({}));
    const role = String(b.role ?? "");
    if (!ROLES.includes(role)) return fail("Pick a valid role");

    if (params.id === user.id && role !== "developer") {
        return fail("You cannot remove your own developer access");
    }

    let clubId = null;
    if (role === "club_admin" || role === "gate") {
        clubId = String(b.club_id ?? "");
        if (!(await getClub(clubId))) return fail("Pick the club this account belongs to");
    }

    const updated = await setUserRole(params.id, role, clubId);
    if (!updated) return fail("User not found", 404);
    return ok(updated);
});
