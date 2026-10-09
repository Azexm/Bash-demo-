"use client";

import { useCallback, useEffect, useState } from "react";
import { useNav } from "@/lib/useNav";
import { toast } from "sonner";
import { Plus, Save, RefreshCw } from "lucide-react";
import AppShell from "@/components/AppShell";
import { Card, Field, Btn, Badge, Tabs, Empty, inputCls, fmtDateTime } from "@/components/PanelUI";
import { api, formatErr, inr } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { CITIES } from "@/lib/geo";
import ClubOnboarding from "@/components/ClubOnboarding";

const TABS = [
    { id: "overview", label: "Overview" },
    { id: "clubs", label: "Clubs" },
    { id: "users", label: "Users & roles" },
    { id: "bookings", label: "All bookings" },
    { id: "scans", label: "QR scans" },
    { id: "gateways", label: "Payment gateways" },
];

const ROLE_OPTIONS = [
    { id: "user", label: "User" },
    { id: "club_admin", label: "Club admin" },
    { id: "gate", label: "Gate" },
    { id: "developer", label: "Developer" },
];

const errorText = (e) => formatErr(e?.response?.data?.detail) || e?.message || "Something went wrong";

export default function DevPanelPage() {
    const { user, loading } = useAuth();
    const nav = useNav();
    const [tab, setTab] = useState("overview");

    useEffect(() => {
        if (!loading && !user) nav("/login?next=/dev");
    }, [loading, user, nav]);

    if (loading || !user) {
        return (
            <AppShell>
                <div className="p-10 text-white/60 font-body">Loading…</div>
            </AppShell>
        );
    }
    if (user.role !== "developer") {
        return (
            <AppShell>
                <div className="p-10 text-white/60 font-body">This panel is for developers.</div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <div className="max-w-6xl mx-auto px-5 md:px-10 py-8">
                <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Developer Panel</h1>
                <p className="font-body text-white/50 text-sm mt-1">
                    Every club, user, booking and payment gateway in one place.
                </p>
                <div className="mt-6">
                    <Tabs tabs={TABS} value={tab} onChange={setTab} />
                </div>
                <div className="mt-6">
                    {tab === "overview" && <Overview />}
                    {tab === "clubs" && <ClubsTab />}
                    {tab === "users" && <UsersTab />}
                    {tab === "bookings" && <BookingsTab />}
                    {tab === "scans" && <ScansTab />}
                    {tab === "gateways" && <GatewaysTab />}
                </div>
            </div>
        </AppShell>
    );
}

/* ---------------------------- Overview ---------------------------- */

function Overview() {
    const [data, setData] = useState(null);
    const load = useCallback(() => {
        api.get("/dev/overview").then((r) => setData(r.data)).catch((e) => toast.error(errorText(e)));
    }, []);
    useEffect(() => {
        load();
    }, [load]);

    if (!data) return <div className="text-white/50 font-body">Loading…</div>;

    const bookingMap = Object.fromEntries(data.bookings.map((b) => [b.status, b]));
    const revenue = data.bookings.reduce((s, b) => (b.status === "approved" ? s + b.amount : s), 0);
    const total = data.bookings.reduce((s, b) => s + b.n, 0);

    return (
        <div className="space-y-5">
            <div className="flex justify-end">
                <Btn onClick={load}>
                    <RefreshCw className="w-4 h-4" /> Refresh
                </Btn>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="Approved revenue" value={inr(revenue)} />
                <Stat label="Bookings" value={total} />
                <Stat label="Pending review" value={bookingMap.pending?.n || 0} />
                <Stat label="Admitted (scans)" value={data.scans.find((s) => s.result === "admitted")?.n || 0} />
            </div>
            <div className="grid md:grid-cols-2 gap-5">
                <Card title="Users by role">
                    <div className="space-y-2 font-body text-sm">
                        {ROLE_OPTIONS.map((r) => (
                            <div key={r.id} className="flex justify-between">
                                <span className="text-white/70">{r.label}</span>
                                <span className="font-semibold">{data.roles.find((x) => x.role === r.id)?.n || 0}</span>
                            </div>
                        ))}
                    </div>
                </Card>
                <Card title="Bookings by status">
                    <div className="space-y-2 font-body text-sm">
                        {data.bookings.length === 0 && <div className="text-white/50">No bookings yet.</div>}
                        {data.bookings.map((b) => (
                            <div key={b.status} className="flex justify-between">
                                <span className="text-white/70">{b.status.replace("_", " ")}</span>
                                <span className="font-semibold">{b.n}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}

function Stat({ label, value }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-[11px] uppercase tracking-widest text-white/40 font-body">{label}</div>
            <div className="font-display text-2xl font-bold mt-2">{value}</div>
        </div>
    );
}

/* ---------------------------- Clubs ---------------------------- */

function ClubsTab() {
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ name: "", city_slug: "pune", address: "", capacity: "" });

    const load = useCallback(() => {
        setLoading(true);
        return api
            .get("/dev/clubs")
            .then((r) => setClubs(r.data))
            .catch((e) => toast.error(errorText(e)))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const create = async (e) => {
        e.preventDefault();
        try {
            await api.post("/dev/clubs", form);
            toast.success("Club created");
            setForm({ name: "", city_slug: "pune", address: "", capacity: "" });
            load();
        } catch (err) {
            toast.error(errorText(err));
        }
    };

    return (
        <div className="space-y-5">
            <ClubOnboarding onChanged={load} />

            <Card title="Add a club" subtitle="Quick add without documents. Use Club applications above for a full onboarding.">
                <form onSubmit={create} className="grid md:grid-cols-[1.5fr_1fr_2fr_1fr_auto] gap-3 items-end" data-testid="new-club-form">
                    <input className={inputCls} placeholder="Club name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    <select className={inputCls} value={form.city_slug} onChange={(e) => setForm({ ...form, city_slug: e.target.value })}>
                        {CITIES.map((c) => (
                            <option key={c.slug} value={c.slug} className="bg-[#0b0f19]">{c.name}</option>
                        ))}
                    </select>
                    <input className={inputCls} placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                    <input className={inputCls} type="number" min="10" placeholder="Capacity" required value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
                    <Btn variant="primary" type="submit">
                        <Plus className="w-4 h-4" /> Add
                    </Btn>
                </form>
            </Card>

            {loading ? (
                <div className="text-white/50 font-body">Loading…</div>
            ) : clubs.length === 0 ? (
                <Empty>No clubs yet.</Empty>
            ) : (
                clubs.map((c) => <ClubCardDetail key={c.id} club={c} onSaved={load} />)
            )}
        </div>
    );
}

function ClubCardDetail({ club: c, onSaved }) {
    const [capacity, setCapacity] = useState(String(c.capacity));
    const [busy, setBusy] = useState(false);
    const allocPct = c.capacity ? Math.min(100, Math.round((c.quota_allocated / c.capacity) * 100)) : 0;

    const patch = async (body, msg) => {
        setBusy(true);
        try {
            await api.patch(`/dev/clubs/${c.id}`, body);
            toast.success(msg);
            onSaved();
        } catch (e) {
            toast.error(errorText(e));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 space-y-4" data-testid={`dev-club-${c.id}`}>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="font-display text-xl font-semibold">{c.name}</h3>
                        {c.seeded && <Badge>Built-in</Badge>}
                        <Badge tone={c.is_active ? "green" : "red"}>{c.is_active ? "Active" : "Inactive"}</Badge>
                        {c.verification_status && c.verification_status !== "approved" && (
                            <Badge tone="amber">{c.verification_status === "rejected" ? "Rejected" : "Documents pending"}</Badge>
                        )}
                    </div>
                    <div className="font-body text-xs text-white/50 mt-1">
                        {c.city} · {c.address}
                    </div>
                </div>
                <div className="flex items-end gap-2">
                    <Field label="Capacity">
                        <input type="number" min="10" className={`${inputCls} w-32`} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
                    </Field>
                    <Btn onClick={() => patch({ capacity }, "Capacity saved")} disabled={busy}>
                        <Save className="w-4 h-4" /> Save
                    </Btn>
                    <Btn variant={c.is_active ? "danger" : "good"} onClick={() => patch({ is_active: !c.is_active }, c.is_active ? "Club hidden" : "Club active")} disabled={busy}>
                        {c.is_active ? "Deactivate" : "Activate"}
                    </Btn>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-body text-sm">
                <Mini k="Events" v={`${c.events_published} live · ${c.events_total} total`} />
                <Mini k="Quota allocated" v={`${c.quota_allocated} of ${c.capacity} (${allocPct}%)`} />
                <Mini k="Bookings" v={Object.entries(c.bookings).map(([s, n]) => `${s.replace("_", " ")} ${n}`).join(" · ") || "None"} />
                <Mini k="Approved revenue" v={inr(c.revenue)} />
            </div>

            <div className="font-body text-sm">
                <span className="text-white/40 text-[11px] uppercase tracking-widest mr-2">Staff</span>
                {c.staff.length === 0 ? (
                    <span className="text-white/50">No club admin or gate accounts linked.</span>
                ) : (
                    c.staff.map((s) => (
                        <Badge key={s.id} tone={s.role === "club_admin" ? "blue" : "grey"}>
                            {s.name} · {s.role === "club_admin" ? "admin" : "gate"}
                        </Badge>
                    ))
                )}
            </div>
        </div>
    );
}

function Mini({ k, v }) {
    return (
        <div className="rounded-xl bg-white/5 border border-white/5 p-3">
            <div className="text-[10px] uppercase tracking-widest text-white/40">{k}</div>
            <div className="mt-1 text-white/90">{v}</div>
        </div>
    );
}

/* ---------------------------- Users ---------------------------- */

function UsersTab() {
    const [users, setUsers] = useState([]);
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(() => {
        setLoading(true);
        return Promise.all([api.get("/dev/users"), api.get("/dev/clubs")])
            .then(([u, c]) => {
                setUsers(u.data);
                setClubs(c.data);
            })
            .catch((e) => toast.error(errorText(e)))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <Card title="Users and roles" subtitle="Club admins and gate accounts must belong to a club. Users can always sign in again to pick up a new role.">
            {loading ? (
                <div className="text-white/50 font-body text-sm">Loading…</div>
            ) : (
                <div className="space-y-2" data-testid="users-list">
                    {users.map((u) => (
                        <UserRow key={`${u.id}-${u.role}-${u.club_id}`} user={u} clubs={clubs} onSaved={load} />
                    ))}
                </div>
            )}
        </Card>
    );
}

function UserRow({ user: u, clubs, onSaved }) {
    const [role, setRole] = useState(u.role);
    const [clubId, setClubId] = useState(u.club_id || "");
    const needsClub = role === "club_admin" || role === "gate";
    const dirty = role !== u.role || (needsClub ? clubId !== (u.club_id || "") : false);

    const save = async () => {
        try {
            await api.patch(`/dev/users/${u.id}`, { role, club_id: needsClub ? clubId : null });
            toast.success(`${u.name} is now ${ROLE_OPTIONS.find((r) => r.id === role)?.label}`);
            onSaved();
        } catch (e) {
            toast.error(errorText(e));
        }
    };

    return (
        <div className="grid md:grid-cols-[1.4fr_1fr_1fr_auto] gap-3 items-center rounded-xl border border-white/10 p-3" data-testid={`user-${u.email}`}>
            <div className="min-w-0">
                <div className="font-body font-semibold truncate">{u.name}</div>
                <div className="font-body text-xs text-white/50 truncate">{u.email}</div>
            </div>
            <select className={inputCls} value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLE_OPTIONS.map((r) => (
                    <option key={r.id} value={r.id} className="bg-[#0b0f19]">{r.label}</option>
                ))}
            </select>
            <select className={inputCls} value={clubId} disabled={!needsClub} onChange={(e) => setClubId(e.target.value)}>
                <option value="" className="bg-[#0b0f19]">{needsClub ? "Pick a club…" : "No club"}</option>
                {clubs.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#0b0f19]">{c.name}</option>
                ))}
            </select>
            <Btn variant="primary" disabled={!dirty || (needsClub && !clubId)} onClick={save}>
                Save
            </Btn>
        </div>
    );
}

/* ---------------------------- All bookings ---------------------------- */

function BookingsTab() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(() => {
        setLoading(true);
        return api
            .get("/dev/bookings")
            .then((r) => setRows(r.data))
            .catch((e) => toast.error(errorText(e)))
            .finally(() => setLoading(false));
    }, []);
    useEffect(() => {
        load();
    }, [load]);

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center font-body text-sm text-white/50">
                <span>Latest 200 bookings across all clubs. ID numbers are never shown.</span>
                <Btn onClick={load}>
                    <RefreshCw className="w-4 h-4" /> Refresh
                </Btn>
            </div>
            {loading ? (
                <div className="text-white/50 font-body">Loading…</div>
            ) : rows.length === 0 ? (
                <Empty>No bookings yet.</Empty>
            ) : (
                <div className="rounded-2xl border border-white/10 overflow-x-auto">
                    <table className="w-full text-left font-body text-xs md:text-sm">
                        <thead className="text-[11px] uppercase tracking-widest text-white/40 bg-white/5">
                            <tr>
                                <th className="p-3">When</th>
                                <th className="p-3">Guest</th>
                                <th className="p-3">Event</th>
                                <th className="p-3">Category</th>
                                <th className="p-3">Type</th>
                                <th className="p-3">Amount</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Ticket</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.id} className="border-t border-white/5">
                                    <td className="p-3 whitespace-nowrap text-white/60">{fmtDateTime(r.created_at)}</td>
                                    <td className="p-3">{r.attendee_name}</td>
                                    <td className="p-3">{r.event_title}</td>
                                    <td className="p-3">{r.tier} × {r.quantity}</td>
                                    <td className="p-3">{r.booking_type.replace("_", "-")}</td>
                                    <td className="p-3">{r.amount ? inr(r.amount) : "Free"}</td>
                                    <td className="p-3"><Badge tone={r.status === "approved" ? "green" : r.status === "pending" ? "amber" : "grey"}>{r.status.replace("_", " ")}</Badge></td>
                                    <td className="p-3 font-mono">{r.ticket_code || "—"}{r.used_at ? " ✓" : ""}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

/* ---------------------------- Payment gateways ---------------------------- */

function GatewaysTab() {
    const [gws, setGws] = useState([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(() => {
        setLoading(true);
        return api
            .get("/dev/gateways")
            .then((r) => setGws(r.data))
            .catch((e) => toast.error(errorText(e)))
            .finally(() => setLoading(false));
    }, []);
    useEffect(() => {
        load();
    }, [load]);

    return (
        <div className="space-y-4">
            <p className="font-body text-sm text-white/50">
                Only one gateway is used for checkout: the first enabled one. Secret keys live in server environment
                variables, not in this panel. Checkout is still simulated until a gateway SDK is wired in.
            </p>
            {loading ? (
                <div className="text-white/50 font-body">Loading…</div>
            ) : (
                gws.map((g) => <GatewayRow key={g.id} gw={g} onSaved={load} />)
            )}
        </div>
    );
}

function GatewayRow({ gw, onSaved }) {
    const [enabled, setEnabled] = useState(gw.enabled);
    const [mode, setMode] = useState(gw.mode);
    const [keyId, setKeyId] = useState(gw.key_id || "");

    const save = async () => {
        try {
            await api.patch(`/dev/gateways/${gw.id}`, { enabled, mode, key_id: keyId });
            toast.success(`${gw.name} saved`);
            onSaved();
        } catch (e) {
            toast.error(errorText(e));
        }
    };

    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 grid md:grid-cols-[1fr_auto_1fr_auto_auto] gap-4 items-center" data-testid={`gateway-${gw.id}`}>
            <div>
                <div className="font-display font-semibold">{gw.name}</div>
                <div className="font-body text-xs text-white/40">Last changed {fmtDateTime(gw.updated_at)}</div>
            </div>
            <label className="flex items-center gap-2 font-body text-sm">
                <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="w-4 h-4 accent-purple-500" />
                Enabled
            </label>
            <input className={inputCls} placeholder="Public key id (e.g. rzp_test_…)" value={keyId} onChange={(e) => setKeyId(e.target.value)} />
            <select className={`${inputCls} md:w-28`} value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="test" className="bg-[#0b0f19]">Test</option>
                <option value="live" className="bg-[#0b0f19]">Live</option>
            </select>
            <Btn variant="primary" onClick={save}>
                <Save className="w-4 h-4" /> Save
            </Btn>
        </div>
    );
}

/* ---------------------------- QR scans ---------------------------- */

const SCAN_TONE = {
    admitted: "green",
    scanned: "grey",
    already_used: "amber",
    declined: "red",
    not_approved: "red",
    invalid: "red",
};

const SCAN_LABEL = {
    admitted: "Admitted",
    scanned: "Scanned, no decision",
    already_used: "Already used",
    declined: "Declined",
    not_approved: "Not approved",
    invalid: "Invalid",
};

function ScansTab() {
    const [rows, setRows] = useState([]);
    const [clubs, setClubs] = useState({});
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    const load = useCallback(() => {
        setLoading(true);
        return Promise.all([api.get("/dev/scans"), api.get("/dev/clubs")])
            .then(([s, c]) => {
                setRows(s.data);
                setClubs(Object.fromEntries(c.data.map((x) => [x.id, x.name])));
            })
            .catch((e) => toast.error(errorText(e)))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const counts = rows.reduce((m, r) => ((m[r.result] = (m[r.result] || 0) + 1), m), {});
    const shown = filter === "all" ? rows : rows.filter((r) => r.result === filter);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="Total scans" value={rows.length} />
                <Stat label="Admitted" value={counts.admitted || 0} />
                <Stat label="Declined" value={counts.declined || 0} />
                <Stat label="Problems" value={(counts.already_used || 0) + (counts.not_approved || 0) + (counts.invalid || 0)} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
                {["all", "admitted", "scanned", "declined", "already_used", "not_approved", "invalid"].map((k) => (
                    <button
                        key={k}
                        type="button"
                        onClick={() => setFilter(k)}
                        className={`rounded-full px-3 py-1.5 font-body text-xs border ${filter === k ? "bg-white text-black border-white" : "bg-white/5 text-white/70 border-white/10"}`}
                    >
                        {k === "all" ? "All" : SCAN_LABEL[k]}
                    </button>
                ))}
                <div className="flex-1" />
                <Btn onClick={load} aria-label="Refresh scans">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </Btn>
            </div>

            {loading ? (
                <div className="text-white/50 font-body">Loading…</div>
            ) : shown.length === 0 ? (
                <Empty>No scans match this filter.</Empty>
            ) : (
                <div className="rounded-2xl border border-white/10 overflow-x-auto" data-testid="dev-scan-table">
                    <table className="w-full text-left font-body text-xs md:text-sm">
                        <thead className="text-[11px] uppercase tracking-widest text-white/40 bg-white/5">
                            <tr>
                                <th className="p-3">Scanned</th>
                                <th className="p-3">Result</th>
                                <th className="p-3">Guest</th>
                                <th className="p-3">Phone</th>
                                <th className="p-3">Ticket</th>
                                <th className="p-3">Event</th>
                                <th className="p-3">Club</th>
                                <th className="p-3">Gate staff</th>
                                <th className="p-3">Decided</th>
                                <th className="p-3">Note</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shown.map((r) => (
                                <tr key={r.id} className="border-t border-white/5" data-testid={`dev-scan-${r.id}`}>
                                    <td className="p-3 whitespace-nowrap text-white/60">{fmtDateTime(r.scanned_at)}</td>
                                    <td className="p-3"><Badge tone={SCAN_TONE[r.result] || "grey"}>{SCAN_LABEL[r.result] || r.result}</Badge></td>
                                    <td className="p-3">{r.attendee_name || "—"}</td>
                                    <td className="p-3">{r.attendee_phone || "—"}</td>
                                    <td className="p-3 font-mono">{r.ticket_code || "—"}</td>
                                    <td className="p-3">{r.event_title || "—"}</td>
                                    <td className="p-3">{clubs[r.club_id] || r.club_id || "—"}</td>
                                    <td className="p-3">{r.gate_name || "—"}</td>
                                    <td className="p-3 whitespace-nowrap text-white/60">{r.decided_at ? fmtDateTime(r.decided_at) : "—"}</td>
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
