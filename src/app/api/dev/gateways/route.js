import { requireRole } from "@/lib/roles";
import { listGateways } from "@/lib/gatewayStore";
import { ok, route } from "@/lib/http";

export const dynamic = "force-dynamic";

export const GET = route(async (req) => {
    const { error } = await requireRole(req, ["developer"]);
    if (error) return error;
    return ok(await listGateways());
});
