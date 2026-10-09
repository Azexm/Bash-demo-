"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNav } from "@/lib/useNav";
import { toast } from "sonner";
import { Plus, Upload, Pencil, RefreshCw, Trash2, X, Check, Ban, ArrowRightLeft, Send, Loader2 } from "lucide-react";
import AppShell from "@/components/AppShell";
import { Card, Field, Btn, Badge, Tabs, Empty, inputCls, fmtDateTime } from "@/components/PanelUI";
import { api, formatErr, inr } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { isVerified } from "@/lib/clubOnboarding";
import {
    GENRES,
    BOOKING_TYPES,
    HOMEPAGE_PLACEMENTS,
    sumQuota,
    toDisplayDate,
} from "@/lib/eventSchema";

const TABS = [
    { id: "events", label: "Events" },
    { id: "bookings", label: "Booking queue" },
    { id: "gates", label: "Gate accounts" },
    { id: "scans", label: "Scan logs" },
];

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const errorText = (e) => {
    const d = e?.response?.data?.detail;
    return formatErr(d) || e?.message || "Something went wrong";
};

// "17 March 2026" -> "2026-03-17" (for <input type=date>)
const isoDate = (display) => {
    const m = /^(\d{1,2}) ([A-Za-z]+) (\d{4})$/.exec(display || "");
    const mi = m ? MONTHS.indexOf(m[2]) : -1;
    if (mi < 0) return "";
    return `${m[3]}-${String(mi + 1).padStart(2, "0")}-${String(m[1]).padStart(2, "0")}`;
};

// "7:00 PM" -> "19:00" (for <input type=time>)
const time24 = (display) => {
    const m = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(display || "");
    if (!m) return "";
    let h = Number(m[1]) % 12;
    if (m[3] === "PM") h += 12;
    return `${String(h).padStart(2, "0")}:${m[2]}`;
};

const BLANK_FORM = () => ({
    title: "",
    artist: "",
    subtitle: "",
    description: "",
    date: "",
    time: "",
    genres: [],
    booking_type: "non_exclusive",
    featured: false,
    homepage_placement: "none",
    image: "",
    age_limit: "",
    doors_open: "",
    duration: "",
    getting_there: "",
    parking: "",
    tiers: [{ name: "General", price: "", quota: "", note: "", perks: "" }],
});

// Stored event -> editable form
const formFromEvent = (ev) => ({
    title: ev.title || "",
    artist: ev.artist || "",
    subtitle: ev.subtitle || "",
    description: ev.description || "",
    date: isoDate(ev.date),
    time: time24(ev.time),
    genres: ev.genre_slugs || [],
    booking_type: ev.booking_type || "non_exclusive",
    featured: !!ev.featured,
    homepage_placement: ev.homepage_placement || "none",
    image: ev.image || "",
    age_limit: ev.info?.age_limit || "",
    doors_open: ev.info?.doors_open || "",
    duration: ev.info?.duration || "",
    getting_there: ev.location?.getting_there || "",
    parking: ev.location?.parking || "",
    tiers: ev.tiers.map((t) => ({
        name: t.name,
        price: String(t.price),
        quota: String(t.quota ?? ""),
        note: t.note || "",
        perks: (t.perks || []).join("\n"),
    })),
});

// Form -> API body (perks: one per line in the form, array in the API)
const toPayload = (f) => ({
    ...f,
    tiers: f.tiers.map((t) => ({
        name: t.name.trim(),
        price: t.price,
        quota: t.quota,
        note: t.note,
        perks: String(t.perks || "")
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
    })),
});

const TYPE_HELP = {
    non_exclusive: "Open sale. The ticket is issued as soon as payment succeeds.",
    guestlist: "Free request. You approve or reject each guest before a ticket is issued.",
    exclusive: "Paid request. You review after payment. A rejected booking is refunded.",
};

const EMAIL_TEXT = {
    sent: ["success", "Ticket emailed to the guest"],
    not_configured: ["error", "Ticket approved, but no email was sent. Set RESEND_API_KEY on the server."],
    failed: ["error", "Ticket approved, but the email failed to send. Check the email log."],
};

/* ------------------------------------------------------------------ */

export default function ClubPanelPage() {
    const { user, loading } = useAuth();
    const nav = useNav();
    const [tab, setTab] = useState("events");

    useEffect(() => {
        if (!loading && !user) nav("/login?next=/club");
    }, [loading, user, nav]);

    if (loading || !user) {
        return (
            <AppShell>
                <div className="p-10 text-white/60 font-body">Loading…</div>
            </AppShell>
        );
    }
    if (user.role !== "club_admin") {
        return (
            <AppShell>
                <div className="p-10 text-white/60 font-body">This panel is for club admins.</div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <div className="max-w-6xl mx-auto px-5 md:px-10 py-8">
                <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Club Panel</h1>
                <p className="font-body text-white/50 text-sm mt-1">
                    Create events, review guest bookings, manage the door.
                </p>
                <div className="mt-6">
                    <Tabs tabs={TABS} value={tab} onChange={setTab} />
                </div>
                <div className="mt-6">
                    {tab === "events" && <EventsTab />}
                    {tab === "bookings" && <BookingsTab />}
                    {tab === "gates" && <GatesTab />}
                    {tab === "scans" && <ScansTab />}
                </div>
            </div>
        </AppShell>
    );
}

/* ---------------------------- Events ---------------------------- */

function EventsTab() {
    const [data, setData] = useState({ club: null, events: [] });
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null); // null | "new" | event

    const load = useCallback(() => {
        setLoading(true);
        return api
            .get("/club/events")
            .then((r) => setData(r.data))
            .catch((e) => toast.error(errorText(e)))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const togglePublish = async (ev) => {
        const body = toPayload(formFromEvent(ev));
        body.status = ev.status === "published" ? "draft" : "published";
        try {
            await api.put(`/club/events/${ev.id}`, body);
            toast.success(body.status === "published" ? "Published. It is live on the homepage." : "Moved back to draft.");
            load();
        } catch (e) {
            toast.error(errorText(e));
        }
    };

    if (editing) {
        return (
            <EventEditor
                club={data.club}
                events={data.events}
                initial={editing === "new" ? null : editing}
                onDone={() => {
                    setEditing(null);
                    load();
                }}
                onCancel={() => setEditing(null)}
            />
        );
    }

    const verified = isVerified(data.club);
    return (
        <div className="space-y-4">
            {data.club && !verified && (
                <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4 font-body text-sm text-amber-100" data-testid="club-unverified-banner">
                    Your club is not approved yet. Bash is reviewing your documents. You can create events once the club is approved.
                </div>
            )}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="font-body text-sm text-white/60" data-testid="club-summary">
                    {data.club ? (
                        <>
                            <span className="text-white font-semibold">{data.club.name}</span> · {data.club.city} · venue
                            capacity <span className="text-white font-semibold">{data.club.capacity}</span>
                        </>
                    ) : (
                        "Loading club…"
                    )}
                </div>
                <Btn variant="primary" onClick={() => setEditing("new")} disabled={!verified} data-testid="new-event-btn">
                    <Plus className="w-4 h-4" /> New event
                </Btn>
            </div>

            {loading ? (
                <div className="text-white/50 font-body">Loading…</div>
            ) : data.events.length === 0 ? (
                <Empty>No events yet. Create your first one.</Empty>
            ) : (
                <div className="space-y-3">
                    {data.events.map((ev) => (
                        <EventRow
                            key={ev.id}
                            ev={ev}
                            onEdit={() => setEditing(ev)}
                            onToggle={() => togglePublish(ev)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function EventRow({ ev, onEdit, onToggle }) {
    const quota = sumQuota(ev.tiers);
    const sold = ev.tiers.reduce((s, t) => s + (t.quota && t.remaining != null ? t.quota - t.remaining : 0), 0);
    const genreNames = (ev.genre_slugs || [])
        .map((slug) => GENRES.find((g) => g.slug === slug)?.name)
        .filter(Boolean);
    const placement = HOMEPAGE_PLACEMENTS.find((p) => p.slug === ev.homepage_placement);

    return (
        <div
            data-testid={`club-event-${ev.id}`}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col md:flex-row md:items-center gap-4"
        >
            {ev.image ? (
                <img src={ev.image} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0" />
            ) : (
                <div className="w-20 h-20 rounded-xl bg-white/5 border border-dashed border-white/15 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display font-semibold truncate">{ev.title}</span>
                    <Badge tone={ev.status === "published" ? "green" : "amber"}>
                        {ev.status === "published" ? "Published" : "Draft"}
                    </Badge>
                    {ev.seeded && <Badge>Built-in listing</Badge>}
                    {ev.featured && <Badge tone="blue">Featured</Badge>}
                    {placement && placement.slug !== "none" && <Badge tone="blue">{placement.name}</Badge>}
                </div>
                <div className="text-xs text-white/50 font-body mt-1">
                    {ev.date} · {ev.time} · {BOOKING_TYPES.find((b) => b.slug === ev.booking_type)?.name}
                </div>
                {genreNames.length > 0 && (
                    <div className="text-xs text-white/50 font-body mt-0.5">{genreNames.join(" · ")}</div>
                )}
                <div className="text-xs text-white/70 font-body mt-2">
                    Quota {quota} · sold {sold} ·{" "}
                    {ev.tiers.map((t) => `${t.name} ${t.price ? inr(t.price) : "free"}`).join(", ")}
                </div>
            </div>
            {!ev.seeded && (
                <div className="flex gap-2 shrink-0">
                    <Btn onClick={onEdit}>
                        <Pencil className="w-4 h-4" /> Edit
                    </Btn>
                    <Btn variant={ev.status === "published" ? "ghost" : "good"} onClick={onToggle}>
                        {ev.status === "published" ? "Unpublish" : "Publish"}
                    </Btn>
                </div>
            )}
        </div>
    );
}

function EventEditor({ club, events, initial, onDone, onCancel }) {
    const [form, setForm] = useState(() => (initial ? formFromEvent(initial) : BLANK_FORM()));
    const [errors, setErrors] = useState([]);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const setTier = (i, k, v) =>
        setForm((f) => ({ ...f, tiers: f.tiers.map((t, idx) => (idx === i ? { ...t, [k]: v } : t)) }));
    const addTier = () =>
        setForm((f) => ({ ...f, tiers: [...f.tiers, { name: "", price: "", quota: "", note: "", perks: "" }] }));
    const removeTier = (i) => setForm((f) => ({ ...f, tiers: f.tiers.filter((_, idx) => idx !== i) }));
    const toggleGenre = (slug) =>
        setForm((f) => {
            if (f.genres.includes(slug)) return { ...f, genres: f.genres.filter((g) => g !== slug) };
            if (f.genres.length >= 4) return f;
            return { ...f, genres: [...f.genres, slug] };
        });

    // Live quota check. The server enforces it too.
    const capacity = club?.capacity || 0;
    const day = toDisplayDate(form.date);
    const mine = sumQuota(form.tiers);
    const others = events
        .filter((e) => e.status === "published" && e.date === day && e.id !== initial?.id)
        .reduce((s, e) => s + sumQuota(e.tiers), 0);
    const left = capacity - mine - others;

    const onFlyer = (file) => {
        if (!file) return;
        if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return toast.error("Use a JPG, PNG or WebP flyer");
        if (file.size > 2 * 1024 * 1024) return toast.error("Flyer must be under 2 MB");
        const reader = new FileReader();
        reader.onload = async () => {
            setUploading(true);
            try {
                const { data } = await api.post("/club/assets", { data_url: reader.result });
                set("image", data.url);
            } catch (e) {
                toast.error(errorText(e));
            } finally {
                setUploading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const save = async (status) => {
        setErrors([]);
        setSaving(true);
        const body = { ...toPayload(form), status };
        try {
            if (initial) await api.put(`/club/events/${initial.id}`, body);
            else await api.post("/club/events", body);
            toast.success(status === "published" ? "Event published" : "Draft saved");
            onDone();
        } catch (e) {
            const d = e?.response?.data?.detail;
            setErrors(Array.isArray(d) ? d.map((x) => x.msg) : [errorText(e)]);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-5" data-testid="event-editor">
            <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-semibold">{initial ? "Edit event" : "New event"}</h2>
                <Btn onClick={onCancel}>
                    <X className="w-4 h-4" /> Back to events
                </Btn>
            </div>

            <Card title="Basics">
                <div className="grid md:grid-cols-2 gap-4">
                    <Field label="Event title">
                        <input className={inputCls} value={form.title} onChange={(e) => set("title", e.target.value)} data-testid="ev-title" />
                    </Field>
                    <Field label="Artist / host">
                        <input className={inputCls} value={form.artist} onChange={(e) => set("artist", e.target.value)} />
                    </Field>
                    <Field label="Subtitle" className="md:col-span-2">
                        <input className={inputCls} value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
                    </Field>
                    <Field label="Description" className="md:col-span-2">
                        <textarea rows={4} className={inputCls} value={form.description} onChange={(e) => set("description", e.target.value)} />
                    </Field>
                </div>
            </Card>

            <Card title="Date, flyer and genre tags">
                <div className="grid md:grid-cols-2 gap-4">
                    <Field label="Date">
                        <input type="date" className={inputCls} value={form.date} onChange={(e) => set("date", e.target.value)} data-testid="ev-date" />
                    </Field>
                    <Field label="Start time">
                        <input type="time" className={inputCls} value={form.time} onChange={(e) => set("time", e.target.value)} data-testid="ev-time" />
                    </Field>
                </div>

                <div className="grid md:grid-cols-[200px_1fr] gap-4 items-start">
                    <div>
                        <div className="font-body text-[11px] uppercase tracking-widest text-white/50 mb-1.5">Flyer</div>
                        <div className="aspect-[4/5] w-full rounded-xl bg-white/5 border border-dashed border-white/15 overflow-hidden flex items-center justify-center">
                            {form.image ? (
                                <img src={form.image} alt="Flyer preview" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs text-white/40 font-body">No flyer yet</span>
                            )}
                        </div>
                        <label className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-2 font-body text-sm cursor-pointer">
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            {form.image ? "Replace flyer" : "Upload flyer"}
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                data-testid="flyer-input"
                                onChange={(e) => onFlyer(e.target.files?.[0])}
                            />
                        </label>
                        <p className="text-[11px] text-white/40 font-body mt-1">JPG, PNG or WebP, under 2 MB.</p>
                    </div>

                    <div>
                        <div className="font-body text-[11px] uppercase tracking-widest text-white/50 mb-1.5">
                            Genre tags (up to 4)
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {GENRES.map((g) => {
                                const on = form.genres.includes(g.slug);
                                return (
                                    <button
                                        key={g.slug}
                                        type="button"
                                        data-testid={`genre-tag-${g.slug}`}
                                        onClick={() => toggleGenre(g.slug)}
                                        className={`rounded-full px-3.5 py-1.5 font-body text-sm border transition ${
                                            on ? "bg-white text-black border-white" : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
                                        }`}
                                    >
                                        {g.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </Card>

            <Card title="Booking type" subtitle="How guests get in: open sale, a guestlist, or exclusive access.">
                <div className="grid md:grid-cols-3 gap-3">
                    {BOOKING_TYPES.map((b) => (
                        <button
                            key={b.slug}
                            type="button"
                            data-testid={`booking-type-${b.slug}`}
                            onClick={() => set("booking_type", b.slug)}
                            className={`text-left rounded-2xl border p-4 transition ${
                                form.booking_type === b.slug ? "border-purple-400 bg-purple-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                            }`}
                        >
                            <div className="font-display font-semibold">{b.name}</div>
                            <div className="font-body text-xs text-white/60 mt-1">{TYPE_HELP[b.slug]}</div>
                        </button>
                    ))}
                </div>
            </Card>

            <Card title="Homepage placement">
                <div className="grid md:grid-cols-2 gap-4 items-end">
                    <label className="flex items-center gap-3 font-body text-sm">
                        <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} className="w-4 h-4 accent-purple-500" />
                        Featured event (shown first in listings)
                    </label>
                    <Field label="Homepage placement">
                        <select className={inputCls} value={form.homepage_placement} onChange={(e) => set("homepage_placement", e.target.value)}>
                            {HOMEPAGE_PLACEMENTS.map((p) => (
                                <option key={p.slug} value={p.slug} className="bg-[#0b0f19]">
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </Field>
                </div>
            </Card>

            <Card
                title="Ticket categories and quotas"
                subtitle="Each category has a quota (seats for sale). Quotas for one date cannot add up to more than the venue capacity."
                action={
                    <Btn onClick={addTier}>
                        <Plus className="w-4 h-4" /> Add category
                    </Btn>
                }
            >
                <div className={`mb-4 rounded-xl p-3 text-sm font-body border ${left < 0 ? "bg-red-500/10 border-red-400/30 text-red-200" : "bg-white/5 border-white/10 text-white/70"}`} data-testid="quota-summary">
                    Venue capacity <b className="text-white">{capacity}</b> · this event <b className="text-white">{mine}</b> · other events on{" "}
                    {day || "this date"} <b className="text-white">{others}</b> · left <b className="text-white">{left}</b>
                    {left < 0 && <span className="block mt-1">Over capacity. Lower the quotas before saving.</span>}
                </div>

                <div className="space-y-4">
                    {form.tiers.map((t, i) => (
                        <div key={i} className="rounded-2xl border border-white/10 p-4 space-y-3">
                            <div className="grid md:grid-cols-[1fr_120px_120px_1fr_auto] gap-3 items-end">
                                <Field label="Category">
                                    <input className={inputCls} value={t.name} placeholder="Stag, Couple, VIP…" onChange={(e) => setTier(i, "name", e.target.value)} />
                                </Field>
                                <Field label="Price (₹)" hint="0 = free">
                                    <input type="number" min="0" className={inputCls} value={t.price} onChange={(e) => setTier(i, "price", e.target.value)} />
                                </Field>
                                <Field label="Quota">
                                    <input type="number" min="1" className={inputCls} value={t.quota} onChange={(e) => setTier(i, "quota", e.target.value)} data-testid={`tier-quota-${i}`} />
                                </Field>
                                <Field label="Note">
                                    <input className={inputCls} value={t.note} placeholder="Limited, Standing…" onChange={(e) => setTier(i, "note", e.target.value)} />
                                </Field>
                                <button
                                    type="button"
                                    onClick={() => removeTier(i)}
                                    disabled={form.tiers.length === 1}
                                    aria-label="Remove category"
                                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <Field label="Perks (one per line)">
                                <textarea rows={2} className={inputCls} value={t.perks} onChange={(e) => setTier(i, "perks", e.target.value)} />
                            </Field>
                        </div>
                    ))}
                </div>
            </Card>

            <Card title="Venue info for guests">
                <div className="grid md:grid-cols-3 gap-4">
                    <Field label="Age limit">
                        <input className={inputCls} value={form.age_limit} placeholder="18+" onChange={(e) => set("age_limit", e.target.value)} />
                    </Field>
                    <Field label="Doors open">
                        <input className={inputCls} value={form.doors_open} placeholder="10:00 PM" onChange={(e) => set("doors_open", e.target.value)} />
                    </Field>
                    <Field label="Duration">
                        <input className={inputCls} value={form.duration} placeholder="Approx. 5 hrs" onChange={(e) => set("duration", e.target.value)} />
                    </Field>
                    <Field label="Getting there" className="md:col-span-2">
                        <input className={inputCls} value={form.getting_there} onChange={(e) => set("getting_there", e.target.value)} />
                    </Field>
                    <Field label="Parking">
                        <input className={inputCls} value={form.parking} onChange={(e) => set("parking", e.target.value)} />
                    </Field>
                </div>
            </Card>

            {errors.length > 0 && (
                <div data-testid="event-errors" className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 font-body text-sm text-red-200 space-y-1">
                    {errors.map((m, i) => (
                        <div key={i}>• {m}</div>
                    ))}
                </div>
            )}

            <div className="flex flex-wrap gap-3 justify-end pb-6">
                <Btn onClick={onCancel}>Cancel</Btn>
                <Btn onClick={() => save("draft")} disabled={saving} data-testid="save-draft-btn">
                    Save draft
                </Btn>
                <Btn variant="primary" onClick={() => save("published")} disabled={saving || left < 0} data-testid="publish-btn">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Publish
                </Btn>
            </div>
        </div>
    );
}

/* ---------------------------- Booking queue ---------------------------- */

const STATUS_TABS = [
    { id: "pending", label: "Pending" },
    { id: "approved", label: "Approved" },
    { id: "rejected", label: "Rejected" },
    { id: "cancelled", label: "Cancelled" },
    { id: "awaiting_payment", label: "Unpaid" },
];

const STATUS_TONE = {
    pending: "amber",
    approved: "green",
    rejected: "red",
    cancelled: "red",
    awaiting_payment: "grey",
};

function BookingsTab() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("pending");
    const [eventId, setEventId] = useState("all");
    const [open, setOpen] = useState(null);

    const load = useCallback(() => {
        setLoading(true);
        return api
            .get("/club/bookings")
            .then((r) => setRows(r.data))
            .catch((e) => toast.error(errorText(e)))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const events = useMemo(() => {
        const m = new Map();
        rows.forEach((r) => m.set(r.event_id, r.event_title));
        return [...m.entries()];
    }, [rows]);

    const counts = useMemo(() => {
        const c = {};
        rows.forEach((r) => (c[r.status] = (c[r.status] || 0) + 1));
        return c;
    }, [rows]);

    const shown = rows.filter((r) => r.status === status && (eventId === "all" || r.event_id === eventId));

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                {STATUS_TABS.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => setStatus(t.id)}
                        data-testid={`queue-${t.id}`}
                        className={`rounded-full px-4 py-2 font-body text-sm border transition ${
                            status === t.id ? "bg-white text-black border-white" : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
                        }`}
                    >
                        {t.label} <span className="opacity-60">{counts[t.id] || 0}</span>
                    </button>
                ))}
                <div className="flex-1" />
                <select
                    value={eventId}
                    onChange={(e) => setEventId(e.target.value)}
                    className="rounded-full bg-white/5 border border-white/10 px-4 py-2 font-body text-sm outline-none"
                >
                    <option value="all" className="bg-[#0b0f19]">All events</option>
                    {events.map(([id, title]) => (
                        <option key={id} value={id} className="bg-[#0b0f19]">
                            {title}
                        </option>
                    ))}
                </select>
                <Btn onClick={load} aria-label="Refresh">
                    <RefreshCw className="w-4 h-4" />
                </Btn>
            </div>

            {loading ? (
                <div className="text-white/50 font-body">Loading…</div>
            ) : shown.length === 0 ? (
                <Empty>Nothing in {STATUS_TABS.find((t) => t.id === status)?.label.toLowerCase()}.</Empty>
            ) : (
                <div className="space-y-2" data-testid="queue-list">
                    {shown.map((b) => (
                        <button
                            key={b.id}
                            type="button"
                            onClick={() => setOpen(b)}
                            data-testid={`booking-row-${b.id}`}
                            className="w-full text-left rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 p-4 flex flex-col md:flex-row md:items-center gap-3 transition"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="font-display font-semibold truncate">{b.attendee_name}</div>
                                <div className="font-body text-xs text-white/50 truncate">
                                    {b.event_title} · {b.tier} × {b.quantity} · {b.attendee_email}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Badge tone={b.booking_type === "non_exclusive" ? "grey" : "blue"}>
                                    {BOOKING_TYPES.find((t) => t.slug === b.booking_type)?.name.split(" (")[0]}
                                </Badge>
                                <PhotoBadge status={b.photo_status} />
                                <Badge tone={STATUS_TONE[b.status]}>{b.status.replace("_", " ")}</Badge>
                                {b.used_at && <Badge tone="green">Admitted</Badge>}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {open && (
                <BookingDrawer
                    booking={open}
                    onClose={() => setOpen(null)}
                    onChanged={(updated) => {
                        setRows((rs) => rs.map((r) => (r.id === updated.id ? updated : r)));
                        setOpen(updated);
                    }}
                />
            )}
        </div>
    );
}

function PhotoBadge({ status }) {
    if (status === "on_file") return <Badge tone="amber">ID photo on file</Badge>;
    if (status === "deleted") return <Badge tone="green">ID photo deleted</Badge>;
    return <Badge>No ID photo</Badge>;
}

function BookingDrawer({ booking: b, onClose, onChanged }) {
    const [photo, setPhoto] = useState(null);
    const [photoState, setPhotoState] = useState("idle");
    const [reason, setReason] = useState("");
    const [transfer, setTransfer] = useState({ attendee_name: "", attendee_email: "", attendee_phone: "" });
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    // Load the ID photo only while the booking is still awaiting a decision.
    useEffect(() => {
        setPhoto(null);
        setReason("");
        setErr("");
        if (b.photo_status === "on_file" && b.status === "pending") {
            setPhotoState("loading");
            api.get(`/club/bookings/${b.id}/photo`)
                .then((r) => {
                    setPhoto(r.data.data);
                    setPhotoState("ok");
                })
                .catch(() => setPhotoState("none"));
        } else {
            setPhotoState("idle");
        }
    }, [b.id, b.status, b.photo_status]);

    const act = async (action, extra = {}) => {
        setBusy(true);
        setErr("");
        try {
            const { data } = await api.patch(`/club/bookings/${b.id}`, { action, ...extra });
            onChanged(data.booking);
            if (data.email) {
                const [tone, text] = EMAIL_TEXT[data.email.status] || ["success", "Done"];
                toast[tone](text);
            } else {
                toast.success(
                    { reject: "Booking rejected", cancel: "Booking cancelled", transfer: "Ticket transferred", resend: "Ticket emailed" }[action] || "Done",
                );
            }
        } catch (e) {
            setErr(errorText(e));
        } finally {
            setBusy(false);
        }
    };

    const canDecide = b.status === "pending";
    const canCancel = ["awaiting_payment", "pending", "approved"].includes(b.status) && !b.used_at;
    const canTransfer = ["pending", "approved"].includes(b.status) && !b.used_at;
    const tooShort = reason.trim().length < 3;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end" onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                data-testid="booking-drawer"
                className="w-full max-w-xl h-full overflow-y-auto bg-[#0b0f19] border-l border-white/10 p-6 space-y-5"
            >
                <div className="flex items-start justify-between">
                    <div>
                        <div className="font-body text-xs uppercase tracking-widest text-white/40">Guest booking</div>
                        <h3 className="font-display text-2xl font-bold mt-1">{b.attendee_name}</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <Badge tone={STATUS_TONE[b.status]} testid="drawer-status">{b.status.replace("_", " ")}</Badge>
                            {b.used_at && <Badge tone="green">Admitted {fmtDateTime(b.used_at)}</Badge>}
                        </div>
                    </div>
                    <button onClick={onClose} aria-label="Close" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <Card title="Guest details">
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 font-body text-sm">
                        <Detail k="Email" v={b.attendee_email} />
                        <Detail k="Phone" v={b.attendee_phone} />
                        <Detail k="Event" v={b.event_title} />
                        <Detail k="Category" v={`${b.tier} × ${b.quantity}`} />
                        <Detail k="Amount" v={b.amount ? inr(b.amount) : "Free"} />
                        <Detail k="Booking type" v={BOOKING_TYPES.find((t) => t.slug === b.booking_type)?.name} />
                        <Detail k="ID" v={`${b.id_type} ending ${b.id_last4}`} />
                        <Detail k="Paid via" v={b.payment_gateway ? `${b.payment_gateway} (${b.payment_method})` : "Not paid yet"} />
                        <Detail k="Ticket code" v={b.ticket_code || "Issued on approval"} mono />
                        <Detail k="Requested" v={fmtDateTime(b.created_at)} />
                    </dl>
                    {b.transferred_from && (
                        <div className="mt-4 text-xs font-body text-white/60">Transferred from {b.transferred_from}</div>
                    )}
                    {b.review_reason && (
                        <div className="mt-4 text-xs font-body text-white/60">Reason: {b.review_reason}</div>
                    )}
                </Card>

                <Card title="ID check" subtitle="The photo is shown only while the booking is pending. It is deleted after any decision.">
                    {b.photo_status === "on_file" && b.status === "pending" ? (
                        photoState === "loading" ? (
                            <div className="text-white/50 font-body text-sm">Loading photo…</div>
                        ) : photo ? (
                            <img src={photo} alt="Guest ID" data-testid="id-photo-view" className="rounded-xl max-h-80 w-full object-contain bg-black/40" />
                        ) : (
                            <div className="text-white/50 font-body text-sm">The photo could not be loaded.</div>
                        )
                    ) : b.photo_status === "deleted" ? (
                        <div className="flex items-center gap-2 text-emerald-200 font-body text-sm" data-testid="photo-deleted-confirm">
                            <Check className="w-4 h-4" /> ID photo deleted {b.photo_deleted_at ? fmtDateTime(b.photo_deleted_at) : ""} after the decision. Nothing is kept.
                        </div>
                    ) : (
                        <div className="text-white/50 font-body text-sm">No ID photo for this booking (open booking).</div>
                    )}
                </Card>

                {canDecide && (
                    <Card title="Decision">
                        <div className="space-y-3">
                            <Btn variant="good" className="w-full" onClick={() => act("approve")} disabled={busy} data-testid="approve-btn">
                                <Check className="w-4 h-4" /> Approve and issue ticket
                            </Btn>
                        </div>
                    </Card>
                )}

                {(canDecide || canCancel) && (
                    <Card title="Reason" subtitle="Required to reject or cancel. The guest does not see it unless you tell them.">
                        <textarea rows={2} className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Name on ID does not match the booking" data-testid="reason-input" />
                        <div className="flex flex-wrap gap-2 mt-3">
                            {canDecide && (
                                <Btn variant="danger" disabled={busy || tooShort} onClick={() => act("reject", { reason })} data-testid="reject-btn">
                                    <Ban className="w-4 h-4" /> Reject
                                </Btn>
                            )}
                            {canCancel && (
                                <Btn variant="danger" disabled={busy || tooShort} onClick={() => act("cancel", { reason })} data-testid="cancel-btn">
                                    <X className="w-4 h-4" /> Cancel booking
                                </Btn>
                            )}
                        </div>
                    </Card>
                )}

                {canTransfer && (
                    <Card title="Transfer ticket" subtitle="Moves the ticket to someone else. The ticket code stays the same.">
                        <div className="grid gap-3">
                            <input className={inputCls} placeholder="New attendee name" value={transfer.attendee_name} onChange={(e) => setTransfer({ ...transfer, attendee_name: e.target.value })} />
                            <input className={inputCls} placeholder="New attendee email" value={transfer.attendee_email} onChange={(e) => setTransfer({ ...transfer, attendee_email: e.target.value })} />
                            <input className={inputCls} placeholder="New attendee phone" value={transfer.attendee_phone} onChange={(e) => setTransfer({ ...transfer, attendee_phone: e.target.value })} />
                            <Btn onClick={() => act("transfer", transfer)} disabled={busy} data-testid="transfer-btn">
                                <ArrowRightLeft className="w-4 h-4" /> Transfer
                            </Btn>
                        </div>
                    </Card>
                )}

                {b.status === "approved" && (
                    <Card title="Ticket email">
                        <Btn onClick={() => act("resend")} disabled={busy} data-testid="resend-btn">
                            <Send className="w-4 h-4" /> Resend ticket email
                        </Btn>
                    </Card>
                )}

                {err && (
                    <div data-testid="drawer-error" className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 font-body text-sm text-red-200">
                        {err}
                    </div>
                )}
            </div>
        </div>
    );
}

function Detail({ k, v, mono = false }) {
    return (
        <div>
            <dt className="text-[11px] uppercase tracking-widest text-white/40">{k}</dt>
            <dd className={`text-white/90 break-all ${mono ? "font-mono" : ""}`}>{v || "—"}</dd>
        </div>
    );
}

/* ---------------------------- Gate accounts ---------------------------- */

function GatesTab() {
    const [gates, setGates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [busy, setBusy] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        return api
            .get("/club/gates")
            .then((r) => setGates(r.data))
            .catch((e) => toast.error(errorText(e)))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const add = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            await api.post("/club/gates", form);
            toast.success("Gate account created. Share the login with your door staff.");
            setForm({ name: "", email: "", password: "" });
            load();
        } catch (err) {
            toast.error(errorText(err));
        } finally {
            setBusy(false);
        }
    };

    const remove = async (id) => {
        if (!window.confirm("Remove this gate account? They will lose scanner access.")) return;
        try {
            await api.delete(`/club/gates/${id}`);
            toast.success("Gate account removed");
            load();
        } catch (err) {
            toast.error(errorText(err));
        }
    };

    return (
        <div className="grid md:grid-cols-[360px_1fr] gap-5 items-start">
            <Card title="Add gate account" subtitle="Gate staff sign in and go straight to the scanner.">
                <form onSubmit={add} className="space-y-3" data-testid="gate-form">
                    <input className={inputCls} placeholder="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    <input className={inputCls} type="email" placeholder="Login email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    <input className={inputCls} type="password" placeholder="Password (min 6)" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                    <Btn variant="primary" type="submit" disabled={busy} className="w-full">
                        <Plus className="w-4 h-4" /> Create gate account
                    </Btn>
                </form>
            </Card>

            <Card title="Gate accounts">
                {loading ? (
                    <div className="text-white/50 font-body text-sm">Loading…</div>
                ) : gates.length === 0 ? (
                    <Empty>No gate accounts yet.</Empty>
                ) : (
                    <div className="space-y-2">
                        {gates.map((g) => (
                            <div key={g.id} className="flex items-center justify-between rounded-xl border border-white/10 p-3" data-testid={`gate-${g.id}`}>
                                <div>
                                    <div className="font-body font-semibold">{g.name}</div>
                                    <div className="font-body text-xs text-white/50">{g.email}</div>
                                </div>
                                <Btn variant="danger" onClick={() => remove(g.id)} aria-label="Remove gate account">
                                    <Trash2 className="w-4 h-4" /> Remove
                                </Btn>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}

/* ---------------------------- Scan logs ---------------------------- */

const RESULT = {
    admitted: ["green", "Admitted"],
    scanned: ["grey", "Scanned"],
    already_used: ["amber", "Already used"],
    declined: ["red", "Declined"],
    not_approved: ["red", "Not approved"],
    invalid: ["red", "Invalid"],
};

function ScansTab() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(() => {
        setLoading(true);
        return api
            .get("/club/scans")
            .then((r) => setRows(r.data))
            .catch((e) => toast.error(errorText(e)))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const count = (k) => rows.filter((r) => r.result === k).length;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(RESULT).map(([k, [tone, label]]) => (
                    <div key={k} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <Badge tone={tone}>{label}</Badge>
                        <div className="font-display text-3xl font-bold mt-2" data-testid={`scan-count-${k}`}>{count(k)}</div>
                    </div>
                ))}
            </div>

            <div className="flex justify-end">
                <Btn onClick={load} aria-label="Refresh scans">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </Btn>
            </div>

            {loading ? (
                <div className="text-white/50 font-body">Loading…</div>
            ) : rows.length === 0 ? (
                <Empty>No scans yet. Entries appear here as the gate scans tickets.</Empty>
            ) : (
                <div className="rounded-2xl border border-white/10 overflow-x-auto" data-testid="scan-table">
                    <table className="w-full text-left font-body text-sm">
                        <thead className="text-[11px] uppercase tracking-widest text-white/40 bg-white/5">
                            <tr>
                                <th className="p-3">When</th>
                                <th className="p-3">Result</th>
                                <th className="p-3">Ticket code</th>
                                <th className="p-3">Scanned by</th>
                                <th className="p-3">Note</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.id} className="border-t border-white/5">
                                    <td className="p-3 whitespace-nowrap text-white/70">{fmtDateTime(r.scanned_at)}</td>
                                    <td className="p-3">
                                        <Badge tone={RESULT[r.result]?.[0]}>{RESULT[r.result]?.[1] || r.result}</Badge>
                                    </td>
                                    <td className="p-3 font-mono text-xs">{r.ticket_code || "—"}</td>
                                    <td className="p-3">{r.gate_name || "—"}</td>
                                    <td className="p-3 text-white/60">{r.reason || "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
