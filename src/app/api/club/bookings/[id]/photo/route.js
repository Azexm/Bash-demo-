import { requireRole } from "@/lib/roles";
import { getIdPhotoForReview } from "@/lib/bookingStore";
import { fail, ok, route } from "@/lib/http";

export const dynamic = "force-dynamic";

// Club admin: view a guest's ID photo while reviewing. Gone once the booking is decided.
export const GET = route(async (req, { params }) => {
    const { user, error } = await requireRole(req, ["club_admin"]);
    if (error) return error;
    const data = await getIdPhotoForReview(params.id, user.club_id);
    if (!data) return fail("The ID photo was deleted or never uploaded", 404);
    return ok({ data });
});
