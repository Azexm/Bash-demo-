import { requireRole } from "@/lib/roles";
import { updateGateway } from "@/lib/gatewayStore";
import { fail, ok, route } from "@/lib/http";

export const dynamic = "force-dynamic";

// Developer: enable/disable a gateway, switch test/live, set the public key id.
// Secret keys are configured in the server environment, never through this API.
export const PATCH = route(async (req, { params }) => {
    const { error } = await requireRole(req, ["developer"]);
    if (error) return error;
    const b = await req.json().catch(() => ({}));
    const gw = await updateGateway(params.id, b);
    if (!gw) return fail("Gateway not found", 404);
    return ok(gw);
});
