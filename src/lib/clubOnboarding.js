// Shared (server + client): what a club must provide before Bash activates it,
// which documents are required, and the validation rules.
import { CITIES } from "@/lib/geo";

// Clubs created before onboarding existed have no status. They count as approved.
export const isVerified = (club) => (club?.verification_status ?? "approved") === "approved";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const FIELD_GROUPS = [
    {
        id: "business",
        title: "Business and legal",
        fields: [
            { key: "legal_name", label: "Legal business name", req: true, hint: "As on the licence or registration" },
            { key: "trade_name", label: "Club / brand name", req: true },
            { key: "entity_type", label: "Entity type", req: true, type: "select", options: ["Sole proprietor", "Partnership", "LLP", "Private limited", "Other"] },
            { key: "cin", label: "CIN / LLP number", hint: "If registered" },
            { key: "gstin", label: "GSTIN", req: true, upper: true },
            { key: "business_pan", label: "Business PAN", req: true, upper: true },
            { key: "registered_address", label: "Registered address", req: true, type: "textarea" },
            { key: "city_slug", label: "City", req: true, type: "city" },
        ],
    },
    {
        id: "licences",
        title: "Licences and permissions",
        fields: [
            { key: "liquor_licence_no", label: "Liquor licence number", req: true },
            { key: "liquor_licence_expiry", label: "Liquor licence expiry", req: true, type: "date" },
            { key: "entertainment_licence_no", label: "Entertainment / event licence number", req: true },
            { key: "entertainment_expiry", label: "Entertainment licence expiry", req: true, type: "date" },
            { key: "fire_noc_no", label: "Fire NOC number", req: true },
            { key: "fire_noc_expiry", label: "Fire NOC expiry", req: true, type: "date" },
            { key: "fire_noc_capacity", label: "Maximum capacity on fire NOC", req: true, type: "number", hint: "This becomes the venue capacity used for quota checks" },
            { key: "trade_licence_no", label: "Trade licence number", req: true },
            { key: "occupancy_cert_no", label: "Occupancy certificate number" },
            { key: "sound_permission_no", label: "Sound / noise permission number" },
        ],
    },
    {
        id: "venue",
        title: "Venue",
        fields: [
            { key: "venue_name", label: "Venue name", req: true },
            { key: "venue_address", label: "Venue full address", req: true, type: "textarea" },
            { key: "maps_url", label: "Google Maps link" },
            { key: "floors", label: "Floors / rooms", type: "number" },
            { key: "opening_days", label: "Opening days", hint: "For example Thu to Sun" },
            { key: "closing_time", label: "Licensed closing time", type: "time" },
        ],
    },
    {
        id: "people",
        title: "People",
        fields: [
            { key: "owner_name", label: "Owner / authorised signatory", req: true },
            { key: "owner_mobile", label: "Owner mobile", req: true, type: "tel" },
            { key: "owner_email", label: "Owner email", req: true, type: "email" },
            { key: "admin_name", label: "Club admin name", req: true },
            { key: "admin_mobile", label: "Club admin mobile", req: true, type: "tel" },
            { key: "admin_email", label: "Club admin email (login)", req: true, type: "email" },
            { key: "emergency_contact", label: "Emergency contact at venue", req: true, type: "tel" },
        ],
    },
    {
        id: "payments",
        title: "Bank settlement",
        fields: [
            { key: "account_holder", label: "Account holder name", req: true },
            { key: "account_number", label: "Account number", req: true },
            { key: "ifsc", label: "IFSC code", req: true, upper: true },
            { key: "bank_name", label: "Bank name", req: true },
            { key: "payment_gateway", label: "Existing payment gateway (optional)" },
        ],
    },
    {
        id: "policy",
        title: "Policy and guest info",
        fields: [
            { key: "age_limit", label: "Age limit", req: true, placeholder: "18+" },
            { key: "id_check_policy", label: "How ID is checked at entry", req: true, type: "textarea" },
            { key: "refund_policy", label: "Refund / cancellation policy", type: "textarea" },
            { key: "dress_code", label: "Dress code" },
            { key: "genres", label: "Usual genres", hint: "Comma separated, for example techno, house" },
        ],
    },
    {
        id: "display",
        title: "Guest-facing info",
        fields: [
            { key: "description", label: "Short description", req: true, type: "textarea" },
            { key: "instagram", label: "Instagram handle" },
            { key: "website", label: "Website" },
            { key: "parking", label: "Parking / nearest landmark" },
        ],
    },
];

export const ALL_FIELDS = FIELD_GROUPS.flatMap((g) => g.fields);

// Documents Bash needs. "expiry" names the field that holds the document's expiry date.
export const DOCUMENTS = [
    { kind: "liquor_licence", label: "Liquor licence", req: true, expiry: "liquor_licence_expiry" },
    { kind: "entertainment_licence", label: "Entertainment / event licence", req: true, expiry: "entertainment_expiry" },
    { kind: "fire_noc", label: "Fire NOC", req: true, expiry: "fire_noc_expiry" },
    { kind: "trade_licence", label: "Trade licence", req: true },
    { kind: "business_pan", label: "Business PAN card", req: true },
    { kind: "gst_certificate", label: "GST certificate", req: true },
    { kind: "bank_proof", label: "Cancelled cheque or bank letter", req: true },
    { kind: "owner_id", label: "Owner ID and address proof", req: true },
    { kind: "agreement", label: "Signed partnership agreement", req: true },
    { kind: "occupancy_certificate", label: "Occupancy certificate", req: false },
    { kind: "sound_permission", label: "Sound / noise permission", req: false },
];

export const DOC_MIME = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
// Kept under 3 MB so the base64 upload stays below the 4.5 MB request limit on Vercel.
export const MAX_DOC_BYTES = 3 * 1024 * 1024;

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Cleans and checks an application. Returns { application, errors }.
 * forApproval: also requires every licence to still be valid today.
 */
export function validateApplication(raw = {}, { forApproval = false } = {}) {
    const application = {};
    const errors = [];

    for (const f of ALL_FIELDS) {
        let v = raw[f.key] == null ? "" : String(raw[f.key]).trim();
        if (f.upper) v = v.toUpperCase();
        if (f.type === "tel") v = v.replace(/[\s-]/g, "");
        if (f.type === "number" && v !== "") {
            const n = Number(v);
            if (Number.isFinite(n)) v = String(Math.round(n));
            else {
                errors.push(`${f.label} must be a number`);
                v = "";
            }
        }
        application[f.key] = v;
        if (f.req && !v) errors.push(`${f.label} is required`);
        if (f.type === "date" && v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) errors.push(`${f.label} must be a date`);
    }

    const rules = [
        ["business_pan", /^[A-Z]{5}\d{4}[A-Z]$/, "Business PAN looks wrong (format ABCDE1234F)"],
        ["gstin", /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/, "GSTIN looks wrong (15 characters)"],
        ["ifsc", /^[A-Z]{4}0[A-Z\d]{6}$/, "IFSC looks wrong (format HDFC0001234)"],
        ["account_number", /^\d{9,18}$/, "Account number should be 9 to 18 digits"],
        ["owner_mobile", /^\+?\d{10,13}$/, "Owner mobile should be 10 digits"],
        ["admin_mobile", /^\+?\d{10,13}$/, "Club admin mobile should be 10 digits"],
        ["emergency_contact", /^\+?\d{10,13}$/, "Emergency contact should be 10 digits"],
        ["owner_email", EMAIL, "Owner email looks wrong"],
        ["admin_email", EMAIL, "Club admin email looks wrong"],
    ];
    for (const [key, re, msg] of rules) {
        if (application[key] && !re.test(application[key])) errors.push(msg);
    }

    const cap = Number(application.fire_noc_capacity);
    if (application.fire_noc_capacity && (cap < 10 || cap > 100000)) {
        errors.push("Fire NOC capacity must be between 10 and 100,000");
    }
    if (application.city_slug && !CITIES.some((c) => c.slug === application.city_slug)) {
        errors.push("Pick a city we operate in");
    }

    if (forApproval) {
        for (const d of DOCUMENTS) {
            if (!d.expiry || !application[d.expiry]) continue;
            if (application[d.expiry] < today()) {
                const label = ALL_FIELDS.find((f) => f.key === d.expiry)?.label || d.label;
                errors.push(`${label} has passed. The club must renew it first.`);
            }
        }
    }

    return { application, errors };
}
