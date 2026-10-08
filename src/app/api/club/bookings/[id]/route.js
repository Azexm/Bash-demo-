import { requireRole } from "@/lib/roles";
import { getClubBooking, reviewBooking } from "@/lib/bookingStore";
import { sendTicketEmail } from "@/lib/email";
import { fail, ok, route } from "@/lib/http";

export const dynamic = "force-dynamic";

const str = (v, max) => String(v ?? "").trim().slice(0, max);

// Club admin decisions. Body: { action, reason?, attendee_name?, attendee_email?, attendee_phone? }
//   approve | reject (needs reason) | cancel (needs reason) | transfer | resend
export const PATCH = route(async (req, { params }) => {
    const { user, error } = await requireRole(req, ["club_admin"]);
    if (error) return error;
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "");

    if (action === "resend") {
        const booking = await getClubBooking(params.id, user.club_id);
        if (!booking) return fail("Booking not found", 404);
        if (booking.status !== "approved") return fail("Only approved tickets can be emailed", 409);
        return ok({ booking, email: await sendTicketEmail(booking) });
    }

    let attendee = null;
    if (action === "transfer") {
        attendee = {
            name: str(body.attendee_name, 80),
            email: str(body.attendee_email, 200),
            phone: str(body.attendee_phone, 20).replace(/\s/g, ""),
        };
        if (!attendee.name) return fail("New attendee name is required");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(attendee.email)) return fail("Enter a valid email for the new attendee");
        if (!/^\+?\d{10,13}$/.test(attendee.phone)) return fail("Enter a valid phone number for the new attendee");
    }

    const booking = await reviewBooking({
        bookingId: params.id,
        clubId: user.club_id,
        reviewerId: user.id,
        action,
        reason: body.reason,
        attendee,
    });

    // Approving issues the ticket, so email it straight away.
    if (action === "approve") return ok({ booking, email: await sendTicketEmail(booking) });
    return ok({ booking });
});
