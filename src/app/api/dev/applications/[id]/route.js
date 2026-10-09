import { requireRole } from "@/lib/roles";
import { getApplicationDetail, updateApplication } from "@/lib/onboardingStore";
import { fail, ok, route } from "@/lib/http";

export const dynamic = "force-dynamic";

export const GET = route(async (req, { params }) => {
    const { error } = await requireRole(req, ["developer"]);
    if (error) return error;
    const detail = await getApplicationDetail(params.id);
    if (!detail) return fail("Application not found", 404);
    return ok(detail);
});

export const PUT = route(async (req, { params }) => {
    const { error } = await requireRole(req, ["developer"]);
    if (error) return error;
    const body = await req.json().catch(() => ({}));
    return ok(await updateApplication(params.id, body));
});
