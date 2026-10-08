import { requireRole } from "@/lib/roles";
import { getClub } from "@/lib/clubStore";
import { listEvents, createEvent } from "@/lib/eventStore";
import { checkVenueQuota, normalizeClubEvent } from "@/lib/eventSchema";
import { fail, ok, route } from "@/lib/http";

export const dynamic = "force-dynamic";

// Club admin: all events for their club (drafts included), plus the club's venue details.
export const GET = route(async (req) => {
    const { user, error } = await requireRole(req, ["club_admin"]);
    if (error) return error;
    const [club, events] = await Promise.all([
        getClub(user.club_id),
        listEvents({ club_id: user.club_id, includeDrafts: true }),
    ]);
    return ok({ club, events });
});

// Club admin: create a draft or publish. Quotas are checked against venue capacity.
export const POST = route(async (req) => {
    const { user, error } = await requireRole(req, ["club_admin"]);
    if (error) return error;
    const club = await getClub(user.club_id);
    if (!club) return fail("Your club was not found", 404);

    const raw = await req.json().catch(() => ({}));
    const { event, errors } = normalizeClubEvent(raw, club);
    if (errors) return fail(errors.map((msg) => ({ msg })), 422);

    const sameDay = (await listEvents({ club_id: club.id })).filter((e) => e.date === event.date);
    const quotaError = checkVenueQuota(event.tiers, club.capacity, sameDay);
    if (quotaError) return fail(quotaError, 422);

    return ok(await createEvent(event), 201);
});
