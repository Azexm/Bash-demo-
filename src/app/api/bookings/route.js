import { getUserFromRequest } from "@/lib/auth";
import { getEvent } from "@/lib/eventStore";
import { createBooking, saveIdPhoto, checkIdPhoto, soldCounts } from "@/lib/bookingStore";
import { fail, ok, route } from "@/lib/http";
import { BOOKING_TYPES } from "@/lib/eventSchema";

export const dynamic = "force-dynamic";

const ID_TYPES = ["Aadhaar", "PAN", "Passport"];

export const POST = route(async (req) => {
    const user = await getUserFromRequest(req);
    if (!user) return fail("Sign in to book tickets", 401);

    const b = await req.json().catch(() => ({}));

    const event = await getEvent(String(b.event_id ?? ""));
    if (!event) return fail("Event not found", 404);

    const tier = event.tiers.find((t) => t.name.toLowerCase() === String(b.tier ?? "").toLowerCase());
    if (!tier) return fail("Ticket tier not found");

    const quantity = Number(b.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 4)
        return fail("You can book 1 to 4 tickets at a time");

    // Quota: never sell past the category quota (cancelled and rejected bookings release seats)
    if (tier.quota) {
        const sold = (await soldCounts()).get(`${event.id}::${tier.name}`) || 0;
        const left = Math.max(0, tier.quota - sold);
        if (quantity > left) {
            return fail(left === 0 ? `${tier.name} is sold out` : `Only ${left} ${tier.name} tickets left`, 409);
        }
    }

    const name = String(b.attendee_name ?? "").trim().slice(0, 80);
    const email = String(b.attendee_email ?? "").trim().slice(0, 200);
    const phone = String(b.attendee_phone ?? "").replace(/\s/g, "");
    if (!name || !email) return fail("Please fill all attendee fields");
    if (!/^\+?\d{10,13}$/.test(phone)) return fail("Enter a valid phone number");

    const idType = String(b.id_type ?? "");
    if (!ID_TYPES.includes(idType)) return fail("Choose a valid ID type");
    const idNumber = String(b.id_number ?? "").replace(/\s|-/g, "");
    if (idType === "Aadhaar" ? !/^\d{12}$/.test(idNumber) : idNumber.length < 6)
        return fail(idType === "Aadhaar" ? "Aadhaar must be a 12-digit number" : "Enter a valid ID number");

    const bookingType = event.booking_type || "non_exclusive";
    const needsPhoto = bookingType !== "non_exclusive";
    if (needsPhoto && !b.id_photo) return fail("Upload a photo of your ID for this event");
    // validate the photo before creating anything, so a bad upload leaves no half-made booking
    if (needsPhoto) checkIdPhoto(b.id_photo);

    const booking = await createBooking({
        user_id: user.id,
        club_id: event.club_id || null,
        event_id: event.id,
        tier: tier.name,
        quantity,
        // guestlist requests are free; everything else costs the category price
        amount: bookingType === "guestlist" ? 0 : tier.price * quantity,
        booking_type: bookingType,
        attendee_name: name,
        attendee_email: email,
        attendee_phone: phone,
        id_type: idType,
        id_last4: idNumber.slice(-4), // the full ID number is never stored
        // snapshot so tickets keep working if the event is edited later
        event_title: event.title,
        event_venue: event.venue,
        event_city: event.city,
        event_date: event.date,
        event_time: event.time,
        event_image: event.image,
    });

    if (needsPhoto) await saveIdPhoto(booking.id, b.id_photo);
    return ok({ ...booking, booking_type_name: BOOKING_TYPES.find((t) => t.slug === bookingType)?.name }, 201);
});
