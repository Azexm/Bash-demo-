import { requireRole } from "@/lib/roles";
import { decideDocument, getDocumentData } from "@/lib/onboardingStore";
import { ok, route } from "@/lib/http";

export const dynamic = "force-dynamic";

// The file itself, for review.
export const GET = route(async (req, { params }) => {
    const { error } = await requireRole(req, ["developer"]);
    if (error) return error;
    return ok(await getDocumentData(params.id, params.docId));
});

// Body: { action: approve | reject | reset, note? }
export const PATCH = route(async (req, { params }) => {
    const { error } = await requireRole(req, ["developer"]);
    if (error) return error;
    const b = await req.json().catch(() => ({}));
    return ok(await decideDocument(params.id, params.docId, String(b.action ?? ""), b.note));
});
