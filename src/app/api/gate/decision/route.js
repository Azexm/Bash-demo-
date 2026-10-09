import { requireRole } from "@/lib/roles";
import { decideScan } from "@/lib/bookingStore";
import { ok, route } from "@/lib/http";

export const dynamic = "force-dynamic";

// Gate step 2: approve (admit) or decline the guest from a scan. Body: { scan_id, decision }
export const POST = route(async (req) => {
    const { user, error } = await requireRole(req, ["gate", "club_admin"]);
    if (error) return error;
    const b = await req.json().catch(() => ({}));
    return ok(
        await decideScan({
            scanId: String(b.scan_id ?? ""),
            clubId: user.club_id,
            gate: { id: user.id, name: user.name },
            decision: b.decision,
        }),
    );
});
