"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useNav } from "@/lib/useNav";
import { toast } from "sonner";
import { CheckCircle2, XCircle, AlertTriangle, ScanLine, Loader2 } from "lucide-react";
import AppShell from "@/components/AppShell";
import { Badge, Btn, Card, inputCls, fmtDateTime } from "@/components/PanelUI";
import { api, formatErr } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const RESULT_UI = {
    admitted: { box: "border-emerald-400/50 bg-emerald-500/15", color: "text-emerald-300", icon: CheckCircle2, label: "ADMITTED" },
    already_used: { box: "border-amber-400/50 bg-amber-500/15", color: "text-amber-300", icon: AlertTriangle, label: "ALREADY USED" },
    declined: { box: "border-red-400/50 bg-red-500/15", color: "text-red-300", icon: XCircle, label: "DECLINED" },
    invalid: { box: "border-red-400/50 bg-red-500/15", color: "text-red-300", icon: XCircle, label: "INVALID" },
};

const LOG_TONE = { admitted: "green", already_used: "amber", declined: "red", invalid: "red" };

export default function GatePage() {
    const { user, loading } = useAuth();
    const nav = useNav();
    const [code, setCode] = useState("");
    const [result, setResult] = useState(null);
    const [busy, setBusy] = useState(false);
    const [log, setLog] = useState([]);
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

    // Gate scanners type the code and press Enter, so keep the input focused.
    useEffect(() => {
        inputRef.current?.focus();
    }, [result]);

    const submit = async (e) => {
        e?.preventDefault();
        const clean = code.trim();
        if (!clean || busy) return;
        setBusy(true);
        try {
            const { data } = await api.post("/gate/scan", { code: clean });
            setResult(data);
            setCode("");
            loadLog();
        } catch (err) {
            toast.error(formatErr(err.response?.data?.detail) || err.message);
        } finally {
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

    const ui = result ? RESULT_UI[result.result] : null;

    return (
        <AppShell hideBottomNav>
            <div className="max-w-2xl mx-auto px-5 md:px-10 py-8 space-y-6">
                <div>
                    <h1 className="font-display text-3xl font-bold tracking-tight flex items-center gap-3">
                        <ScanLine className="w-7 h-7" /> Gate scanner
                    </h1>
                    <p className="font-body text-white/50 text-sm mt-1">
                        Scan the ticket QR or type the code (BASH-XXXXXXXX) and press Enter.
                    </p>
                </div>

                <form onSubmit={submit} className="flex gap-3">
                    <input
                        ref={inputRef}
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

                {result && ui && (
                    <div
                        data-testid="gate-result"
                        data-result={result.result}
                        className={`rounded-3xl border-2 p-6 ${ui.box}`}
                    >
                        <div className="flex items-center gap-3">
                            <ui.icon className={`w-10 h-10 ${ui.color}`} />
                            <div>
                                <div className={`font-display text-3xl font-bold ${ui.color}`}>{ui.label}</div>
                                {result.reason && <div className="font-body text-sm text-white/80 mt-1">{result.reason}</div>}
                            </div>
                        </div>
                        {result.ticket && (
                            <dl className="grid grid-cols-2 gap-3 mt-5 font-body text-sm">
                                <div>
                                    <dt className="text-[11px] uppercase tracking-widest text-white/40">Guest</dt>
                                    <dd className="text-white">{result.ticket.attendee_name}</dd>
                                </div>
                                <div>
                                    <dt className="text-[11px] uppercase tracking-widest text-white/40">Category</dt>
                                    <dd className="text-white">
                                        {result.ticket.tier} × {result.ticket.quantity}
                                    </dd>
                                </div>
                                <div className="col-span-2">
                                    <dt className="text-[11px] uppercase tracking-widest text-white/40">Event</dt>
                                    <dd className="text-white">{result.ticket.event_title}</dd>
                                </div>
                            </dl>
                        )}
                        <div className="mt-5">
                            <Btn onClick={() => setResult(null)} data-testid="gate-clear">
                                Next guest
                            </Btn>
                        </div>
                    </div>
                )}

                <Card title="Recent scans" subtitle="Everything scanned at this venue, newest first. Your scans are logged with your name.">
                    {log.length === 0 ? (
                        <div className="font-body text-sm text-white/50">No scans yet.</div>
                    ) : (
                        <ul className="divide-y divide-white/5" data-testid="gate-log">
                            {log.map((r) => (
                                <li key={r.id} className="py-3 flex items-center justify-between gap-3 font-body text-sm">
                                    <div className="min-w-0">
                                        <div className="font-mono text-xs text-white/70 truncate">{r.ticket_code || "—"}</div>
                                        <div className="text-[11px] text-white/40">
                                            {fmtDateTime(r.scanned_at)} · {r.gate_name}
                                        </div>
                                    </div>
                                    <Badge tone={LOG_TONE[r.result] || "grey"}>{r.result.replace("_", " ")}</Badge>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>
        </AppShell>
    );
}
