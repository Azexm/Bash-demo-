// Server-only: gate accounts belong to one club. Club admins create and remove them.
import { sql, ensureReady } from "@/lib/db";
import { createUser } from "@/lib/auth";

export async function listGates(clubId) {
    await ensureReady();
    return sql`SELECT id, name, email, created_at FROM users
                WHERE role = 'gate' AND club_id = ${clubId} ORDER BY created_at DESC`;
}

/** Returns the new user, or null when the email is already registered. */
export async function createGate({ clubId, name, email, password }) {
    return createUser({ name, email, password, role: "gate", club_id: clubId });
}

/** Demotes a gate account back to a normal user. Returns false if it is not one of this club's gates. */
export async function removeGate(id, clubId) {
    await ensureReady();
    const rows = await sql`
        UPDATE users SET role = 'user', club_id = NULL
         WHERE id = ${id} AND role = 'gate' AND club_id = ${clubId} RETURNING id`;
    return rows.length > 0;
}
