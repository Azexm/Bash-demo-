// Server-only club onboarding. Applications: club_applications. Documents: club_documents.
// A new club is created hidden (is_active false) with verification "pending_documents".
// It becomes live only when a developer approves it, and its club admin can create events only then.
import crypto from "crypto";
import { sql, ensureReady } from "@/lib/db";
import { BookingError } from "@/lib/bookingStore";
import { createClub, getClub, updateClub, listClubs } from "@/lib/clubStore";
import { validateApplication, DOCUMENTS, DOC_MIME, MAX_DOC_BYTES } from "@/lib/clubOnboarding";
import { CITIES } from "@/lib/geo";

const iso = (v) => (v ? new Date(v).toISOString() : null);
const DOC_KINDS = DOCUMENTS.map((d) => d.kind);
const cityOf = (slug) => CITIES.find((c) => c.slug === slug);

async function loadApp(clubId) {
    const rows = await sql`SELECT * FROM club_applications WHERE club_id = ${clubId}`;
    return rows[0] || null;
}

// Document metadata only (no file data).
async function loadDocs(clubId) {
    return sql`SELECT id, kind, file_name, mime, status, reviewer_note, uploaded_at
                 FROM club_documents WHERE club_id = ${clubId}`;
}

/** Everything still stopping approval. An empty list means the club is ready. */
export function blockersFor(application, docs) {
    const { errors } = validateApplication(application, { forApproval: true });
    const out = [...errors];
    for (const d of DOCUMENTS.filter((x) => x.req)) {
        const doc = docs.find((x) => x.kind === d.kind);
        if (!doc) out.push(`${d.label}: not uploaded`);
        else if (doc.status === "rejected") out.push(`${d.label}: rejected, upload a new copy`);
        else if (doc.status !== "approved") out.push(`${d.label}: waiting for your review`);
    }
    return out;
}

export async function createApplication(raw) {
    await ensureReady();
    const { application, errors } = validateApplication(raw);
    if (errors.length) throw new BookingError(errors.join(" · "), 422);
    const city = cityOf(application.city_slug);

    const club = await createClub({
        name: application.trade_name,
        city: city.name,
        city_slug: city.slug,
        address: application.venue_address,
        capacity: Number(application.fire_noc_capacity),
        is_active: false,
        verification_status: "pending_documents",
    });
    await sql`INSERT INTO club_applications (club_id, data, status)
              VALUES (${club.id}, ${JSON.stringify(application)}::jsonb, 'pending_documents')`;
    return club;
}

export async function updateApplication(clubId, raw) {
    await ensureReady();
    const app = await loadApp(clubId);
    if (!app) throw new BookingError("Application not found", 404);
    if (app.status === "approved") throw new BookingError("Reopen this club before editing its details", 409);

    const { application, errors } = validateApplication(raw);
    if (errors.length) throw new BookingError(errors.join(" · "), 422);
    const city = cityOf(application.city_slug);

    await updateClub(clubId, {
        name: application.trade_name,
        city: city.name,
        city_slug: city.slug,
        address: application.venue_address,
        capacity: Number(application.fire_noc_capacity),
    });
    await sql`UPDATE club_applications SET data = ${JSON.stringify(application)}::jsonb, updated_at = now()
               WHERE club_id = ${clubId}`;
    return getApplicationDetail(clubId);
}

export async function getApplicationDetail(clubId) {
    await ensureReady();
    const app = await loadApp(clubId);
    if (!app) return null;
    const docs = (await loadDocs(clubId)).map((d) => ({ ...d, uploaded_at: iso(d.uploaded_at) }));
    const club = await getClub(clubId);
    const blockers = app.status === "approved" ? [] : blockersFor(app.data, docs);
    return {
        club,
        status: app.status,
        reviewer_note: app.reviewer_note,
        application: app.data,
        documents: docs,
        blockers,
        can_approve: app.status !== "approved" && blockers.length === 0,
    };
}

export async function listApplications() {
    await ensureReady();
    const apps = await sql`SELECT club_id, status, data, reviewer_note, updated_at
                             FROM club_applications ORDER BY updated_at DESC`;
    const docs = await sql`SELECT club_id, kind, status FROM club_documents`;
    const clubs = new Map((await listClubs({ includeInactive: true })).map((c) => [c.id, c]));
    const required = DOCUMENTS.filter((d) => d.req);

    return apps.map((a) => {
        const mine = docs.filter((d) => d.club_id === a.club_id);
        return {
            club_id: a.club_id,
            status: a.status,
            reviewer_note: a.reviewer_note,
            trade_name: a.data.trade_name,
            city_name: clubs.get(a.club_id)?.city || a.data.city_slug,
            capacity: clubs.get(a.club_id)?.capacity ?? null,
            docs_approved: required.filter((r) => mine.some((m) => m.kind === r.kind && m.status === "approved")).length,
            docs_required: required.length,
        };
    });
}

export async function saveDocument(clubId, kind, fileName, dataUrl) {
    await ensureReady();
    const app = await loadApp(clubId);
    if (!app) throw new BookingError("Application not found", 404);
    if (app.status === "approved") throw new BookingError("Reopen this club before changing documents", 409);
    if (!DOC_KINDS.includes(kind)) throw new BookingError("Unknown document type", 422);

    const m = /^data:([a-z]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/i.exec(String(dataUrl || ""));
    if (!m || !DOC_MIME.includes(m[1].toLowerCase())) {
        throw new BookingError("Upload a JPG, PNG, WebP or PDF file", 422);
    }
    if (Buffer.byteLength(m[2], "base64") > MAX_DOC_BYTES) throw new BookingError("File must be under 3 MB", 422);

    const name = String(fileName || kind).replace(/[^\w.\- ()]/g, "_").slice(0, 80);
    await sql`DELETE FROM club_documents WHERE club_id = ${clubId} AND kind = ${kind}`;
    await sql`INSERT INTO club_documents (id, club_id, kind, file_name, mime, data, status)
              VALUES (${crypto.randomBytes(12).toString("hex")}, ${clubId}, ${kind}, ${name},
                      ${m[1].toLowerCase()}, ${m[2]}, 'pending')`;
    return getApplicationDetail(clubId);
}

export async function getDocumentData(clubId, docId) {
    await ensureReady();
    const rows = await sql`SELECT file_name, mime, data FROM club_documents
                            WHERE id = ${docId} AND club_id = ${clubId}`;
    if (!rows.length) throw new BookingError("Document not found", 404);
    return { file_name: rows[0].file_name, data_url: `data:${rows[0].mime};base64,${rows[0].data}` };
}

/** action: approve | reject (reason required) | reset (back to waiting for review) */
export async function decideDocument(clubId, docId, action, note) {
    await ensureReady();
    const app = await loadApp(clubId);
    if (!app) throw new BookingError("Application not found", 404);
    if (app.status === "approved") throw new BookingError("Reopen this club before changing documents", 409);

    const status = { approve: "approved", reject: "rejected", reset: "pending" }[action];
    if (!status) throw new BookingError("Unknown action", 422);
    const why = action === "reject" ? String(note ?? "").trim() : null;
    if (action === "reject" && why.length < 3) throw new BookingError("Write why the document is rejected", 422);

    const rows = await sql`UPDATE club_documents SET status = ${status}, reviewer_note = ${why}
                            WHERE id = ${docId} AND club_id = ${clubId} RETURNING id`;
    if (!rows.length) throw new BookingError("Document not found", 404);
    return getApplicationDetail(clubId);
}

/** action: approve | reject (reason required) | reopen */
export async function decideApplication(clubId, action, reason) {
    await ensureReady();
    const app = await loadApp(clubId);
    if (!app) throw new BookingError("Application not found", 404);

    if (action === "approve") {
        const detail = await getApplicationDetail(clubId);
        if (detail.blockers.length) {
            const more = detail.blockers.length > 3 ? ` and ${detail.blockers.length - 3} more` : "";
            throw new BookingError(`Not ready to approve: ${detail.blockers.slice(0, 3).join("; ")}${more}`, 409);
        }
        await updateClub(clubId, {
            verification_status: "approved",
            is_active: true,
            verified_at: new Date().toISOString(),
            capacity: Number(app.data.fire_noc_capacity),
        });
        await sql`UPDATE club_applications SET status = 'approved', reviewer_note = NULL,
                         decided_at = now(), updated_at = now() WHERE club_id = ${clubId}`;
    } else if (action === "reject") {
        const why = String(reason ?? "").trim();
        if (why.length < 3) throw new BookingError("Write the reason for rejecting", 422);
        await updateClub(clubId, { verification_status: "rejected", is_active: false });
        await sql`UPDATE club_applications SET status = 'rejected', reviewer_note = ${why},
                         decided_at = now(), updated_at = now() WHERE club_id = ${clubId}`;
    } else if (action === "reopen") {
        await updateClub(clubId, { verification_status: "pending_documents", is_active: false });
        await sql`UPDATE club_applications SET status = 'pending_documents', reviewer_note = NULL,
                         updated_at = now() WHERE club_id = ${clubId}`;
    } else {
        throw new BookingError("Unknown action", 422);
    }
    return getApplicationDetail(clubId);
}
