"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useNav } from "@/lib/useNav";
import { toast } from "sonner";
import { CheckCircle2, XCircle, AlertTriangle, ScanLine, QrCode, Keyboard, Loader2, Phone, Mail } from "lucide-react";
import AppShell from "@/components/AppShell";
import QRScanner from "@/components/QRScanner";
import { Badge, Btn, Card, inputCls, fmtDateTime } from "@/components/PanelUI";
import { api, formatErr } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { BOOKING_TYPES } from "@/lib/eventSchema";

const LOG_TONE = {
    admitted: "green",
    scanned: "grey",
    already_used: "amber",
    declined: "red",
    not_approved: "red",
    invalid: "red",
};

const LOG_LABEL = {
    admitted: "Admitted",
    scanned: "Scanned",
    already_used: "Already used",
    declined: "Declined",
    not_approved: "Not approved",
    invalid: "Invalid",
};

const errText = (err) => formatErr(err?.response?.data?.detail) || err?.message || "Something went wrong";

export default function GatePage() {
    const { user, loading } = useAuth();
    const nav = useNav();
    const [mode, setMode] = useState("camera"); // camera | type
    const [code, setCode] = useState("");
    const [look, setLook] = useState(null); // response of /api/gate/lookup
    const [photo, setPhoto] = useState(null);
    const [photoState, setPhotoState] = useState("idle"); // idle | loading | none
    const [decided, setDecided] = useState(null); // response of /api/gate/decision
    const [busy, setBusy] = useState(false);
    const [log, setLog] = useState([]);
    const busyRef = useRef(false);
    const inputRef = useRef(null);

    useEffect(() => {
        if (!loading && !user) nav("/login?next=/gate");
    }, [loading, user, nav]);

    const loadLog = useCallback(() => {
        return api
            .get("/club/scans")
            .then((r) => setLog(r.data.slice(0, 25)))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (user && ["gate", "club_admin"].includes(user.role)) loadLog();
    }, [user, loadLog]);

    const reset = useCallback(() => {
        setLook(null);
        setPhoto(null);
        setPhotoState("idle");
        setDecided(null);
        setCode("");
        loadLog();
    }, [loadLog]);

    // After a decision, show it briefly and go back to the scanner for the next guest.
    useEffect(() => {
        if (!decided) return;
        const t = setTimeout(reset, decided.result === "admitted" ? 1800 : 3000);
        return () => clearTimeout(t);
    }, [decided, reset]);

    // Step 1: a code was read (camera or typed). Load the guest details.
    const lookup = async (raw) => {
        const clean = String(raw ?? "").trim().toUpperCase();
        if (!clean || busyRef.current) return;
        busyRef.current = true;
        setBusy(true);
        try {
            const { data } = await api.post("/gate/lookup", { code: clean });
            setLook(data);
            if (data.booking?.photo_status === "on_file") {
                setPhotoState("loading");
                api.get(`/gate/photo/${data.booking.id}`)
                    .then((r) => {
                        setPhoto(r.data.data);
                        setPhotoState("ok");
                    })
                    .catch(() => setPhotoState("none"));
            } else {
                setPhotoState("none");
            }
        } catch (err) {
            toast.error(errText(err));
        } finally {
            busyRef.current = false;
            setBusy(false);
        }
    };

    // Step 2: approve (admit) or decline.
    const decide = async (decision) => {
        if (!look?.scan_id || busyRef.current) return;
        busyRef.current = true;
        setBusy(true);
        try {
            const { data } = await api.post("/gate/decision", { scan_id: look.scan_id, decision });
            setDecided(data);
            loadLog();
        } catch (err) {
            toast.error(errText(err));
        } finally {
            busyRef.current = false;
            setBusy(false);
        }
    };

    if (loading || !user) {
        return (
            <AppShell hideBottomNav>
                <div className="p-10 text-white/60 font-body">Loading…</div>
            </AppShell>
        );
    }
    if (!["gate", "club_admin"].includes(user.role)) {
        return (
            <AppShell>
                <div className="p-10 text-white/60 font-body">The gate scanner is for gate accounts.</div>
            </AppShell>
        );
    }

    const b = look?.booking;
    const eligible = look?.result === "scanned" && !decided;

    return (
        <AppShell hideBottomNav>
            <div className="max-w-2xl mx-auto px-5 md:px-10 py-6 space-y-5">
                <div className="flex items-center justify-between gap-3">
                    <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
                        <ScanLine className="w-7 h-7" /> Gate
                    </h1>
                    {!look && (
                        <div className="flex rounded-full bg-white/5 border border-white/10 p-1" role="tablist">
                            <button
                                type="button"
                                onClick={() => setMode("camera")}
                                data-testid="mode-camera"
                                className={`flex items-center gap-2 rounded-full px-4 py-2 font-body text-sm ${mode === "camera" ? "bg-white text-black" : "text-white/70"}`}
                            >
                                <QrCode className="w-4 h-4" /> Scan QR
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode("type")}
                                data-testid="mode-type"
                                className={`flex items-center gap-2 rounded-full px-4 py-2 font-body text-sm ${mode === "type" ? "bg-white text-black" : "text-white/70"}`}
                            >
                                <Keyboard className="w-4 h-4" /> Type code
                            </button>
                        </div>
                    )}
                </div>

                {/* ---- waiting for a code ---- */}
                {!look && mode === "camera" && <QRScanner onCode={lookup} />}

                {!look && mode === "type" && (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            lookup(code);
                        }}
                        className="flex gap-3"
                    >
                        <input
                            ref={inputRef}
                            autoFocus
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="BASH-XXXXXXXX"
                            autoComplete="off"
                            autoCapitalize="characters"
                            data-testid="gate-code-input"
                            className={`${inputCls} font-mono text-lg tracking-widest py-4`}
                        />
                        <Btn variant="primary" type="submit" disabled={busy || !code.trim()} className="px-6">
                            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check"}
                        </Btn>
                    </form>
                )}

                {/* ---- guest details + decision ---- */}
                {look && (
                    <GuestPanel
                        look={look}
                        b={b}
                        photo={photo}
                        photoState={photoState}
                        decided={decided}
                        eligible={eligible}
                        busy={busy}
                        onApprove={() => decide("approve")}
                        onDecline={() => decide("decline")}
                        onNext={reset}
                    />
                )}

                <Card title="Recent scans" subtitle="Every scan at this venue, newest first, with your name on it.">
                    {log.length === 0 ? (
                        <div className="font-body text-sm text-white/50">No scans yet.</div>
                    ) : (
                        <ul className="divide-y divide-white/5" data-testid="gate-log">
                            {log.map((r) => (
                                <li key={r.id} className="py-3 flex items-center justify-between gap-3 font-body text-sm">
                                    <div className="min-w-0">
                                        <div className="text-white/90 truncate">{r.attendee_name || "Unknown ticket"}</div>
                                        <div className="font-mono text-[11px] text-white/40">
                                            {r.ticket_code || "—"} · {fmtDateTime(r.scanned_at)} · {r.gate_name}
                                        </div>
                                    </div>
                                    <Badge tone={LOG_TONE[r.result] || "grey"}>{LOG_LABEL[r.result] || r.result}</Badge>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>
        </AppShell>
    );
}

function GuestPanel({ look, b, photo, photoState, decided, eligible, busy, onApprove, onDecline, onNext }) {
    // Banner text: the final decision wins, otherwise the lookup result.
    const banner = decided
        ? decided.result === "admitted"
            ? { cls: "border-emerald-400/60 bg-emerald-500/15", color: "text-emerald-300", Icon: CheckCircle2, text: "ADMITTED" }
            : decided.result === "declined"
              ? { cls: "border-red-400/60 bg-red-500/15", color: "text-red-300", Icon: XCircle, text: "DECLINED" }
              : { cls: "border-amber-400/60 bg-amber-500/15", color: "text-amber-300", Icon: AlertTriangle, text: "ALREADY USED" }
        : look.result === "scanned"
          ? { cls: "border-emerald-400/40 bg-emerald-500/10", color: "text-emerald-300", Icon: CheckCircle2, text: "VALID — CHECK THE GUEST" }
          : look.result === "not_approved"
            ? { cls: "border-red-400/60 bg-red-500/15", color: "text-red-300", Icon: XCircle, text: "NOT APPROVED — DO NOT ADMIT" }
            : look.result === "already_used"
              ? { cls: "border-amber-400/60 bg-amber-500/15", color: "text-amber-300", Icon: AlertTriangle, text: "ALREADY USED" }
              : { cls: "border-red-400/60 bg-red-500/15", color: "text-red-300", Icon: XCircle, text: "INVALID TICKET" };

  const reasonText = decided?.reason || look.reason;

    return (
        <div className="space-y-4" data-testid="gate-result" data-result={decided?.result || look.result}>
            <div className={`rounded-3xl border-2 p-5 ${banner.cls}`}>
                <div className="flex items-center gap-3">
                    <banner.Icon className={`w-9 h-9 shrink-0 ${banner.color}`} />
                    <div>
                        <div className={`font-display text-2xl md:text-3xl font-bold ${banner.color}`} data-testid="gate-banner">
                            {banner.text}
                        </div>
                        {reasonText && <div className="font-body text-sm text-white/80 mt-1">{reasonText}</div>}
                    </div>
                </div>
            </div>

            {b && (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 space-y-5">
                    <div>
                        <div className="font-body text-[11px] uppercase tracking-widest text-white/40">Guest</div>
                        <div className="font-display text-2xl font-bold mt-1" data-testid="gate-guest-name">{b.attendee_name}</div>
                        <div className="mt-2 flex flex-col gap-1 font-body text-sm text-white/80">
                            <a href={`tel:${b.attendee_phone}`} className="flex items-center gap-2 hover:text-white">
                                <Phone className="w-4 h-4" /> {b.attendee_phone}
                            </a>
                            <a href={`mailto:${b.attendee_email}`} className="flex items-center gap-2 hover:text-white break-all">
                                <Mail className="w-4 h-4 shrink-0" /> {b.attendee_email}
                            </a>
                        </div>
                    </div>

                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 font-body text-sm">
                        <Info k="Ticket number" v={b.ticket_code} mono />
                        <Info k="Category" v={`${b.tier} × ${b.quantity}`} />
                        <Info k="Event" v={b.event_title} />
                        <Info k="Booking" v={BOOKING_TYPES.find((t) => t.slug === b.booking_type)?.name.split(" (")[0]} />
                        <Info k="ID type" v={b.id_type} />
                        <Info k="ID number" v={`•••• ${b.id_last4}`} mono />
                    </dl>

                    <div>
                        <div className="font-body text-[11px] uppercase tracking-widest text-white/40 mb-2">ID photo</div>
                        {photoState === "loading" && <div className="text-white/50 font-body text-sm">Loading photo…</div>}
                        {photo && (
                            <img
                                src={photo}
                                alt="Guest ID"
                                data-testid="gate-id-photo"
                                className="w-full max-h-[320px] object-contain rounded-2xl bg-black/40"
                            />
                        )}
                        {photoState !== "loading" && !photo && (
                            <div className="text-white/50 font-body text-sm">
                                {b.photo_status === "deleted"
                                    ? "The ID photo has already been deleted."
                                    : "No ID photo was collected for this booking."}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {eligible ? (
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={onApprove}
                        disabled={busy}
                        data-testid="approve-entry"
                        className="rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-display font-bold text-xl py-6 flex items-center justify-center gap-2 transition"
                    >
                        <CheckCircle2 className="w-6 h-6" /> Approve
                    </button>
                    <button
                        type="button"
                        onClick={onDecline}
                        disabled={busy}
                        data-testid="decline-entry"
                        className="rounded-2xl bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white font-display font-bold text-xl py-6 flex items-center justify-center gap-2 transition"
                    >
                        <XCircle className="w-6 h-6" /> Decline
                    </button>
                </div>
            ) : (
                <Btn variant="primary" className="w-full py-4" onClick={onNext} data-testid="gate-next">
                    Next guest
                </Btn>
            )}
        </div>
    );
}

function Info({ k, v, mono = false }) {
    return (
        <div>
            <dt className="text-[11px] uppercase tracking-widest text-white/40">{k}</dt>
            <dd className={`text-white/90 break-all ${mono ? "font-mono" : ""}`}>{v || "—"}</dd>
        </div>
    );
}
