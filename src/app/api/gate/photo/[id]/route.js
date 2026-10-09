import { requireRole } from "@/lib/roles";
import { getIdPhotoForReview } from "@/lib/bookingStore";
import { fail, ok, route } from "@/lib/http";

export const dynamic = "force-dynamic";

// Gate: the guest's ID photo, only for a booking at this venue, only until the door decides.
export const GET = route(async (req, { params }) => {
    const { user, error } = await requireRole(req, ["gate", "club_admin"]);
    if (error) return error;
    const data = await getIdPhotoForReview(params.id, user.club_id);
    if (!data) return fail("No ID photo on file for this guest", 404);
    return ok({ data });
});
