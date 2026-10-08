import { getUserFromRequest } from "@/lib/auth";
import { payBooking } from "@/lib/bookingStore";
import { activeGateway } from "@/lib/gatewayStore";
import { sendTicketEmail } from "@/lib/email";
import { fail, ok, route } from "@/lib/http";

export const dynamic = "force-dynamic";

// NOTE: payment is still simulated. The gateway chosen in the developer panel is recorded on
// the booking; wire its SDK in here to take real money.
export const POST = route(async (req) => {
    const user = await getUserFromRequest(req);
    if (!user) return fail("Sign in to continue", 401);

    const gateway = await activeGateway();
    if (!gateway) return fail("No payment gateway is enabled right now", 503);

    const b = await req.json().catch(() => ({}));
    const booking = await payBooking({
        bookingId: String(b.booking_id ?? ""),
        userId: user.id,
        method: String(b.payment_method ?? "upi").slice(0, 20),
        gateway: gateway.name,
    });
    if (!booking) return fail("Booking not found", 404);

    // Open bookings get their ticket straight away; email it.
    let email = null;
    if (booking.status === "approved") email = await sendTicketEmail(booking);
    return ok({ ...booking, email_status: email?.status ?? null });
});
