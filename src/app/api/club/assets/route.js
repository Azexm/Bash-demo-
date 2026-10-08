import { requireRole } from "@/lib/roles";
import { saveFlyer } from "@/lib/assetStore";
import { fail, ok, route } from "@/lib/http";

export const dynamic = "force-dynamic";

// Club admin: upload a flyer. Body: { data_url: "data:image/png;base64,..." }
export const POST = route(async (req) => {
    const { error } = await requireRole(req, ["club_admin"]);
    if (error) return error;
    const body = await req.json().catch(() => ({}));
    const saved = await saveFlyer(body.data_url);
    if (saved.error) return fail(saved.error, 422);
    return ok({ url: saved.url }, 201);
});
