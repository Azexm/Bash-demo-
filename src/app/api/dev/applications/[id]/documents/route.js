import { requireRole } from "@/lib/roles";
import { saveDocument } from "@/lib/onboardingStore";
import { ok, route } from "@/lib/http";

export const dynamic = "force-dynamic";

// Body: { kind, file_name, data_url }. Replaces any earlier file of the same kind.
export const POST = route(async (req, { params }) => {
    const { error } = await requireRole(req, ["developer"]);
    if (error) return error;
    const b = await req.json().catch(() => ({}));
    return ok(await saveDocument(params.id, String(b.kind ?? ""), b.file_name, b.data_url));
});
