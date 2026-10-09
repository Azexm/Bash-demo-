import { requireRole } from "@/lib/roles";
import { decideApplication } from "@/lib/onboardingStore";
import { ok, route } from "@/lib/http";

export const dynamic = "force-dynamic";

// Body: { action: approve | reject | reopen, reason? }
export const POST = route(async (req, { params }) => {
    const { error } = await requireRole(req, ["developer"]);
    if (error) return error;
    const b = await req.json().catch(() => ({}));
    return ok(await decideApplication(params.id, String(b.action ?? ""), b.reason));
});
