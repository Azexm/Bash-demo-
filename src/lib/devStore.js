// Server-only queries for the developer panel.
import { sql, ensureReady } from "@/lib/db";
import { listClubs } from "@/lib/clubStore";
import { listEvents } from "@/lib/eventStore";
import { sumQuota } from "@/lib/eventSchema";

export const ROLES = ["user", "club_admin", "gate", "developer"];

export async function devOverview() {
    await ensureReady();
    const roles = await sql`SELECT role, COUNT(*)::int AS n FROM users GROUP BY role`;
    const bookings = await sql`
        SELECT status, COUNT(*)::int AS n, COALESCE(SUM(amount), 0)::int AS amount
          FROM bookings GROUP BY status`;
    const scans = await sql`SELECT result, COUNT(*)::int AS n FROM scan_logs GROUP BY result`;
    return { roles, bookings, scans };
}

/** Every club with its events, quota allocation, booking counts and staff. */
export async function clubsDetail() {
    const clubs = await listClubs({ includeInactive: true });
    const events = await listEvents({ includeDrafts: true });
    await ensureReady();
    const counts = await sql`
        SELECT club_id, status, COUNT(*)::int AS n, COALESCE(SUM(amount), 0)::int AS amount
          FROM bookings GROUP BY club_id, status`;
    const staff = await sql`
        SELECT id, name, email, role, club_id FROM users
         WHERE role IN ('club_admin', 'gate') AND club_id IS NOT NULL`;

    return clubs.map((c) => {
        const mine = events.filter((e) => e.club_id === c.id);
        const bookings = {};
        let revenue = 0;
        for (const r of counts.filter((x) => x.club_id === c.id)) {
            bookings[r.status] = r.n;
            if (r.status === "approved") revenue += r.amount;
        }
        return {
            ...c,
            events_total: mine.length,
            events_published: mine.filter((e) => e.status === "published").length,
            quota_allocated: mine.reduce((s, e) => s + sumQuota(e.tiers), 0),
            bookings,
            revenue,
            staff: staff.filter((s) => s.club_id === c.id),
        };
    });
}

export async function listUsers() {
    await ensureReady();
    return sql`SELECT id, name, email, role, club_id, created_at FROM users ORDER BY created_at DESC LIMIT 300`;
}

export async function setUserRole(id, role, clubId) {
    await ensureReady();
    const rows = await sql`
        UPDATE users SET role = ${role}, club_id = ${clubId}
         WHERE id = ${id} RETURNING id, name, email, role, club_id`;
    return rows[0] || null;
}

export async function listAllBookings() {
    await ensureReady();
    const rows = await sql`
        SELECT id, club_id, event_title, event_venue, tier, quantity, amount, booking_type, status,
               attendee_name, attendee_email, ticket_code, used_at, created_at
          FROM bookings ORDER BY created_at DESC LIMIT 200`;
    return rows;
}
