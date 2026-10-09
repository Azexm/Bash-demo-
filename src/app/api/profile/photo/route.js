import { getUserFromRequest } from "@/lib/auth";
import { setProfilePhoto } from "@/lib/profileStore";
import { fail, ok, route } from "@/lib/http";

export const dynamic = "force-dynamic";

// Body: { slot: "top" | "side", data_url }
export const POST = route(async (req) => {
    const user = await getUserFromRequest(req);
    if (!user) return fail("Sign in first", 401);
    const b = await req.json().catch(() => ({}));
    return ok(await setProfilePhoto(user.id, String(b.slot ?? ""), b.data_url));
});
