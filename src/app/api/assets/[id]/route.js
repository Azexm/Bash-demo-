import { getAsset } from "@/lib/assetStore";
import { fail, route } from "@/lib/http";

export const dynamic = "force-dynamic";

// Public flyer images. Guest ID photos are NOT served here (see /api/club/bookings/[id]/photo).
export const GET = route(async (_req, { params }) => {
    const asset = await getAsset(params.id);
    if (!asset) return fail("Image not found", 404);
    return new Response(Buffer.from(asset.data, "base64"), {
        headers: { "Content-Type": asset.mime, "Cache-Control": "public, max-age=86400" },
    });
});
