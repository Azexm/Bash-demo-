import { requireRole } from "@/lib/roles";
import { isVerified } from "@/lib/clubOnboarding";
import { getClub } from "@/lib/clubStore";
import { getEvent, listEvents, updateEvent } from "@/lib/eventStore";
import { checkVenueQuota, normalizeClubEvent } from "@/lib/eventSchema";
import { fail, ok, route } from "@/lib/http";

export const dynamic = "force-dynamic";

// Club admin: edit (and publish / unpublish) one of their events.
export const PUT = route(async (req, { params }) => {
    const { user, error } = await requireRole(req, ["club_admin"]);
    if (error) return error;

    const existing = await getEvent(params.id, { includeDrafts: true });
    if (!existing || existing.club_id !== user.club_id) return fail("Event not found", 404);
    if (existing.seeded) return fail("Built-in listings cannot be edited here", 409);

    const club = await getClub(user.club_id);
    if (!isVerified(club)) return fail("This club is not approved yet. Bash is reviewing its documents.", 403);
    const raw = await req.json().catch(() => ({}));
    const { event, errors } = normalizeClubEvent(raw, club);
    if (errors) return fail(errors.map((msg) => ({ msg })), 422);

    const sameDay = (await listEvents({ club_id: club.id }))
        .filter((e) => e.id !== params.id && e.date === event.date);
    const quotaError = checkVenueQuota(event.tiers, club.capacity, sameDay);
    if (quotaError) return fail(quotaError, 422);

    const saved = await updateEvent(params.id, event);
    return ok(saved);
});
