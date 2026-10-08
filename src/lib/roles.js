// Server-only role guard for route handlers.
//   user        - books tickets, sees clubs
//   club_admin  - manages one club (events, bookings queue, gate accounts, scan logs)
//   gate        - scans tickets at one club's door
//   developer   - sees everything, manages clubs, users, payment gateways
import { getUserFromRequest } from "@/lib/auth";
import { fail } from "@/lib/http";

/** Returns { user } when the caller has one of `roles`, otherwise { error: NextResponse }. */
export async function requireRole(req, roles) {
    const user = await getUserFromRequest(req);
    if (!user) return { error: fail("Sign in first", 401) };
    if (!roles.includes(user.role)) return { error: fail("Your account cannot do this", 403) };
    if ((user.role === "club_admin" || user.role === "gate") && !user.club_id) {
        return { error: fail("Your account is not linked to a club yet. Ask a developer.", 403) };
    }
    return { user };
}
