import { getUserFromRequest } from "@/lib/auth";
import { getProfile, updateInstagram } from "@/lib/profileStore";
import { fail, ok, route } from "@/lib/http";

export const dynamic = "force-dynamic";

// Any signed-in user: their own profile.
export const GET = route(async (req) => {
    const user = await getUserFromRequest(req);
    if (!user) return fail("Sign in first", 401);
    return ok(await getProfile(user.id));
});

// Body: { instagram }
export const PATCH = route(async (req) => {
    const user = await getUserFromRequest(req);
    if (!user) return fail("Sign in first", 401);
    const b = await req.json().catch(() => ({}));
    return ok(await updateInstagram(user.id, b.instagram));
});
