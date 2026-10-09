// Server-only: unique, human-friendly member ID, e.g. BASH-K7PX-39QM.
// The alphabet leaves out 0, O, 1 and I so the ID is easy to read out loud.
import crypto from "crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function newBashId() {
    const bytes = crypto.randomBytes(8);
    let s = "";
    for (const b of bytes) s += ALPHABET[b % ALPHABET.length];
    return `BASH-${s.slice(0, 4)}-${s.slice(4, 8)}`;
}
