// Server-only ticket email via Resend (https://resend.com).
// Set RESEND_API_KEY and EMAIL_FROM in the environment. Without a key nothing is sent,
// but the attempt is still logged so the club can see it was not delivered.
import crypto from "crypto";
import { sql, ensureReady } from "@/lib/db";

const esc = (v) =>
    String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export async function sendTicketEmail(booking) {
    const key = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM || "Bash Tickets <onboarding@resend.dev>";
    const subject = `Your Bash ticket: ${booking.event_title}`;
    const html = `
        <div style="font-family:Arial,sans-serif;max-width:520px">
          <h2>${esc(booking.event_title)}</h2>
          <p>Hi ${esc(booking.attendee_name)}, here is your ticket.</p>
          <ul>
            <li>Venue: ${esc(booking.event_venue)}, ${esc(booking.event_city)}</li>
            <li>Date: ${esc(booking.event_date)} at ${esc(booking.event_time)}</li>
            <li>Category: ${esc(booking.tier)} × ${esc(booking.quantity)}</li>
          </ul>
          <p style="font-size:20px"><strong>Ticket code: ${esc(booking.ticket_code)}</strong></p>
          <p>Show this code and your ID at the gate. Each ticket is admitted once.</p>
        </div>`;

    let status = "sent";
    let error = null;
    if (!key) {
        status = "not_configured";
        error = "RESEND_API_KEY is not set";
    } else {
        try {
            const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
                body: JSON.stringify({ from, to: [booking.attendee_email], subject, html }),
                cache: "no-store",
            });
            if (!res.ok) {
                status = "failed";
                error = `${res.status} ${(await res.text()).slice(0, 300)}`;
            }
        } catch (e) {
            status = "failed";
            error = e.message;
        }
    }

    await ensureReady();
    await sql`INSERT INTO email_logs (id, booking_id, to_email, subject, status, error)
              VALUES (${crypto.randomBytes(12).toString("hex")}, ${booking.id}, ${booking.attendee_email},
                      ${subject}, ${status}, ${error})`;
    return { status, error };
}
