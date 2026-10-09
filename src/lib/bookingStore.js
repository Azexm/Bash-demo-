// Server-only bookings store (Neon tables: bookings, id_photos).
//
// Booking statuses:
//   awaiting_payment  created, not paid yet (holds quota)
//   pending           paid (or free guestlist request) and waiting in the club's review queue
//   approved          ticket issued (ticket_code set), can be scanned at the gate
//   rejected          club declined it (review_reason set)
//   cancelled         cancelled by the club (review_reason set)
// used_at is set when a gate admits the ticket; the status stays "approved".
import crypto from "crypto";
import { sql, ensureReady } from "@/lib/db";

export class BookingError extends Error {
    constructor(message, status = 422) {
        super(message);
        this.status = status;
    }
}

const iso = (v) => (v ? new Date(v).toISOString() : null);
const ACTIVE = ["awaiting_payment", "pending", "approved"];
const IMAGE_RE = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

// Fields returned to clients (never the user id).
const view = ({ user_id, ...rest }) => ({
    ...rest,
    paid_at: iso(rest.paid_at),
    created_at: iso(rest.created_at),
    used_at: iso(rest.used_at),
    reviewed_at: iso(rest.reviewed_at),
});

// Adds ID photo status for club staff: on_file | deleted | none.
const withPhotoStatus = (row) => {
    const { has_photo_row, photo_deleted_at, ...rest } = row;
    let photo_status = "none";
    if (has_photo_row) photo_status = photo_deleted_at ? "deleted" : "on_file";
    return { ...view(rest), photo_status, photo_deleted_at: iso(photo_deleted_at) };
};

const genCode = () => `BASH-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

// ticket_code is UNIQUE; on the (very unlikely) collision try a new code.
async function withTicketCode(run) {
    for (let i = 0; i < 5; i++) {
        try {
            return await run(genCode());
        } catch (e) {
            if (e?.code !== "23505") throw e;
        }
    }
    throw new Error("Could not allocate a ticket code");
}

/** Count of seats held per "eventId::tierName" (awaiting payment, pending or approved). */
export async function soldCounts() {
    await ensureReady();
    const rows = await sql`
        SELECT event_id, tier, COALESCE(SUM(quantity), 0)::int AS n
          FROM bookings
         WHERE status IN ('awaiting_payment', 'pending', 'approved')
         GROUP BY event_id, tier`;
    return new Map(rows.map((r) => [`${r.event_id}::${r.tier}`, r.n]));
}

export async function listBookingsForUser(userId) {
    await ensureReady();
    const rows = await sql`
        SELECT * FROM bookings WHERE user_id = ${userId} ORDER BY created_at DESC`;
    return rows.map(view);
}

export async function createBooking(d) {
    await ensureReady();
    const id = crypto.randomBytes(12).toString("hex");
    const rows = await sql`
        INSERT INTO bookings (
            id, user_id, club_id, event_id, tier, quantity, amount, booking_type, status,
            attendee_name, attendee_email, attendee_phone, id_type, id_last4,
            event_title, event_venue, event_city, event_date, event_time, event_image
        ) VALUES (
            ${id}, ${d.user_id}, ${d.club_id}, ${d.event_id}, ${d.tier}, ${d.quantity}, ${d.amount},
            ${d.booking_type}, 'awaiting_payment',
            ${d.attendee_name}, ${d.attendee_email}, ${d.attendee_phone}, ${d.id_type}, ${d.id_last4},
            ${d.event_title}, ${d.event_venue}, ${d.event_city}, ${d.event_date}, ${d.event_time}, ${d.event_image}
        ) RETURNING *`;
    return view(rows[0]);
}

/** Throws a BookingError unless the value is a JPG/PNG/WebP data URL under the size limit. */
export function checkIdPhoto(dataUrl) {
    const m = IMAGE_RE.exec(String(dataUrl || ""));
    if (!m) throw new BookingError("ID photo must be a JPG, PNG or WebP image", 422);
    if (Buffer.byteLength(m[2], "base64") > MAX_PHOTO_BYTES) {
        throw new BookingError("ID photo must be under 2 MB", 422);
    }
    return m[0];
}

/** Stores the ID photo for a booking. Call checkIdPhoto() first so nothing is half-saved. */
export async function saveIdPhoto(bookingId, dataUrl) {
    const data = checkIdPhoto(dataUrl);
    await sql`INSERT INTO id_photos (booking_id, data) VALUES (${bookingId}, ${data})
              ON CONFLICT (booking_id) DO UPDATE SET data = EXCLUDED.data, deleted_at = NULL`;
    return true;
}

/** Blanks the ID photo and records when it was deleted. Called on every final decision. */
async function deleteIdPhoto(bookingId) {
    await sql`UPDATE id_photos SET data = '', deleted_at = now()
               WHERE booking_id = ${bookingId} AND deleted_at IS NULL`;
}

/**
 * Pays a booking. Non-exclusive bookings are approved immediately with a ticket code;
 * guestlist and exclusive bookings wait in the club's queue ("pending").
 */
export async function payBooking({ bookingId, userId, method, gateway }) {
    await ensureReady();
    const found = await sql`SELECT * FROM bookings WHERE id = ${bookingId} AND user_id = ${userId}`;
    if (!found.length) return null;
    const b = found[0];
    if (b.status === "approved" || b.status === "pending") return view(b); // already paid: idempotent
    if (b.status !== "awaiting_payment") {
        throw new BookingError(`This booking is ${b.status} and cannot be paid`, 409);
    }

    const next = b.booking_type === "non_exclusive" ? "approved" : "pending";
    const rows = await withTicketCode((code) => sql`
        UPDATE bookings
           SET status = ${next}, ticket_code = ${next === "approved" ? code : null},
               payment_method = ${method}, payment_gateway = ${gateway}, paid_at = now()
         WHERE id = ${bookingId} AND user_id = ${userId} AND status = 'awaiting_payment'
     RETURNING *`);
    if (!rows.length) throw new BookingError("This booking was changed, please refresh", 409);
    return view(rows[0]);
}

/* ---------------- club side ---------------- */

export async function listBookingsForClub(clubId) {
    await ensureReady();
    const rows = await sql`
        SELECT b.*, (p.booking_id IS NOT NULL) AS has_photo_row, p.deleted_at AS photo_deleted_at
          FROM bookings b
          LEFT JOIN id_photos p ON p.booking_id = b.id
         WHERE b.club_id = ${clubId}
         ORDER BY b.created_at DESC
         LIMIT 500`;
    return rows.map(withPhotoStatus);
}

export async function getClubBooking(id, clubId) {
    await ensureReady();
    const rows = await sql`
        SELECT b.*, (p.booking_id IS NOT NULL) AS has_photo_row, p.deleted_at AS photo_deleted_at
          FROM bookings b
          LEFT JOIN id_photos p ON p.booking_id = b.id
         WHERE b.id = ${id} AND b.club_id = ${clubId}`;
    return rows.length ? withPhotoStatus(rows[0]) : null;
}

/** The ID photo for review. Returns null once it has been deleted. */
export async function getIdPhotoForReview(id, clubId) {
    await ensureReady();
    const rows = await sql`
        SELECT p.data, p.deleted_at FROM id_photos p
          JOIN bookings b ON b.id = p.booking_id
         WHERE p.booking_id = ${id} AND b.club_id = ${clubId}`;
    if (!rows.length || rows[0].deleted_at || !rows[0].data) return null;
    return rows[0].data;
}

const reasonOf = (reason) => {
    const r = String(reason ?? "").trim().slice(0, 300);
    if (r.length < 3) throw new BookingError("Please write a short reason (at least 3 characters)", 422);
    return r;
};

/**
 * Club decisions: approve | reject | cancel | transfer.
 * Reject and cancel delete the guest's ID photo. Approve keeps it for the gate.
 */
export async function reviewBooking({ bookingId, clubId, reviewerId, action, reason, attendee }) {
    await ensureReady();
    const rows = await sql`SELECT * FROM bookings WHERE id = ${bookingId} AND club_id = ${clubId}`;
    if (!rows.length) throw new BookingError("Booking not found for your club", 404);
    const b = rows[0];

    if (action === "approve") {
        if (b.status !== "pending") throw new BookingError(`Only pending bookings can be approved (this one is ${b.status})`, 409);
        const up = await withTicketCode((code) => sql`
            UPDATE bookings
               SET status = 'approved', ticket_code = ${code}, reviewed_at = now(),
                   reviewed_by = ${reviewerId}, review_reason = NULL
             WHERE id = ${bookingId} AND status = 'pending'
         RETURNING id`);
        if (!up.length) throw new BookingError("This booking was changed, please refresh", 409);
        // the ID photo stays until the gate makes its decision (see decideScan)
    } else if (action === "reject") {
        if (b.status !== "pending") throw new BookingError(`Only pending bookings can be rejected (this one is ${b.status})`, 409);
        const why = reasonOf(reason);
        await sql`UPDATE bookings SET status = 'rejected', review_reason = ${why}, reviewed_at = now(),
                         reviewed_by = ${reviewerId}
                   WHERE id = ${bookingId} AND status = 'pending'`;
        await deleteIdPhoto(bookingId);
    } else if (action === "cancel") {
        if (!ACTIVE.includes(b.status)) throw new BookingError(`This booking is already ${b.status}`, 409);
        if (b.used_at) throw new BookingError("This ticket was already used at the gate", 409);
        const why = reasonOf(reason);
        await sql`UPDATE bookings SET status = 'cancelled', review_reason = ${why}, reviewed_at = now(),
                         reviewed_by = ${reviewerId}
                   WHERE id = ${bookingId}`;
        await deleteIdPhoto(bookingId);
    } else if (action === "transfer") {
        if (!["pending", "approved"].includes(b.status) || b.used_at) {
            throw new BookingError("Only unused pending or approved tickets can be transferred", 409);
        }
        await sql`UPDATE bookings
                     SET attendee_name = ${attendee.name}, attendee_email = ${attendee.email},
                         attendee_phone = ${attendee.phone},
                         transferred_from = ${`${b.attendee_name} <${b.attendee_email}>`},
                         reviewed_at = now(), reviewed_by = ${reviewerId}
                   WHERE id = ${bookingId}`;
    } else {
        throw new BookingError("Unknown action", 422);
    }
    return getClubBooking(bookingId, clubId);
}

/* ---------------- gate ---------------- */

const normalizeCode = (code) => String(code ?? "").trim().toUpperCase().slice(0, 40);

async function logScan({ bookingId = null, code, clubId, gate, result, reason = null, b = null }) {
    const id = crypto.randomBytes(12).toString("hex");
    await sql`INSERT INTO scan_logs (id, booking_id, ticket_code, event_id, club_id, gate_user_id, gate_name,
                                     result, reason, attendee_name, attendee_phone, event_title, tier, quantity)
              VALUES (${id}, ${bookingId}, ${code}, ${b?.event_id ?? null}, ${clubId}, ${gate.id}, ${gate.name},
                      ${result}, ${reason}, ${b?.attendee_name ?? null}, ${b?.attendee_phone ?? null},
                      ${b?.event_title ?? null}, ${b?.tier ?? null}, ${b?.quantity ?? null})`;
    return id;
}

/**
 * Step 1 of the gate flow: a QR (or typed) code is read. Nothing is admitted yet.
 * Returns the guest details so the gate can check them. Every read is logged as a scan.
 * result: scanned (eligible, waiting for a decision) | not_approved | already_used | invalid
 */
export async function lookupTicket({ code, clubId, gate }) {
    await ensureReady();
    const clean = normalizeCode(code);
    if (!clean) throw new BookingError("Enter a ticket code", 422);

    const rows = await sql`
        SELECT b.*, (p.booking_id IS NOT NULL) AS has_photo_row, p.deleted_at AS photo_deleted_at
          FROM bookings b
          LEFT JOIN id_photos p ON p.booking_id = b.id
         WHERE b.ticket_code = ${clean}`;
    const row = rows[0] && rows[0].club_id === clubId ? rows[0] : null;

    if (!row) {
        const scan_id = await logScan({ code: clean, clubId, gate, result: "invalid", reason: "No ticket with this code at your venue" });
        return { result: "invalid", reason: "No ticket with this code at your venue", scan_id, booking: null };
    }

    const booking = withPhotoStatus(row);
    let result;
    let reason = null;
    if (row.status !== "approved") {
        result = "not_approved";
        reason = row.status === "pending" ? "Not approved by the club yet" : `Ticket is ${row.status}`;
    } else if (row.used_at) {
        result = "already_used";
        reason = `Already admitted at ${new Date(row.used_at).toLocaleTimeString("en-IN")}`;
    } else {
        result = "scanned";
    }

    const scan_id = await logScan({ bookingId: row.id, code: clean, clubId, gate, result, reason, b: row });
    return { result, reason, scan_id, booking };
}

/**
 * Step 2: the gate approves (admits) or declines the guest shown by lookupTicket.
 * Approving sets used_at so the ticket cannot be used twice. The ID photo is deleted
 * once the door has decided, whichever the decision is.
 */
export async function decideScan({ scanId, clubId, gate, decision }) {
    await ensureReady();
    if (!["approve", "decline"].includes(decision)) {
        throw new BookingError("Decision must be approve or decline", 422);
    }
    const rows = await sql`SELECT * FROM scan_logs WHERE id = ${scanId} AND club_id = ${clubId}`;
    if (!rows.length) throw new BookingError("Scan not found", 404);
    const s = rows[0];
    if (s.result !== "scanned") {
        throw new BookingError(`This scan is already ${s.result.replace("_", " ")}`, 409);
    }

    let final;
    let reason = null;
    if (decision === "approve") {
        const up = await sql`UPDATE bookings SET used_at = now()
                               WHERE id = ${s.booking_id} AND club_id = ${clubId}
                                 AND status = 'approved' AND used_at IS NULL
                           RETURNING id`;
        if (up.length) {
            final = "admitted";
        } else {
            final = "already_used";
            reason = "Admitted a moment ago at another gate";
        }
    } else {
        final = "declined";
        reason = "Entry refused at the gate";
    }

    await sql`UPDATE scan_logs SET result = ${final}, reason = ${reason}, decided_at = now()
               WHERE id = ${scanId}`;
    if (s.booking_id) await deleteIdPhoto(s.booking_id);
    return { result: final, reason, scan_id: scanId };
}

export async function listScans(clubId, limit = 200) {
    await ensureReady();
    const rows = await sql`
        SELECT * FROM scan_logs WHERE club_id = ${clubId}
         ORDER BY scanned_at DESC LIMIT ${limit}`;
    return rows.map((r) => ({ ...r, scanned_at: iso(r.scanned_at), decided_at: iso(r.decided_at) }));
}

export { IMAGE_RE, MAX_PHOTO_BYTES };
