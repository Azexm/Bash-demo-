import { requireRole } from "@/lib/roles";
import { createApplication, listApplications } from "@/lib/onboardingStore";
import { ok, route } from "@/lib/http";

export const dynamic = "force-dynamic";

export const GET = route(async (req) => {
    const { error } = await requireRole(req, ["developer"]);
    if (error) return error;
    return ok(await listApplications());
});

// Creates the club (hidden until approved) and its application.
export const POST = route(async (req) => {
    const { error } = await requireRole(req, ["developer"]);
    if (error) return error;
    const body = await req.json().catch(() => ({}));
    return ok(await createApplication(body), 201);
});
