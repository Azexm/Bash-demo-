"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, X, Upload, Eye, Check, Ban, RotateCcw, Pencil } from "lucide-react";
import { Card, Field, Btn, Badge, Empty, inputCls } from "@/components/PanelUI";
import { api, formatErr } from "@/lib/api";
import { CITIES } from "@/lib/geo";
import { FIELD_GROUPS, ALL_FIELDS, DOCUMENTS, DOC_MIME, MAX_DOC_BYTES } from "@/lib/clubOnboarding";

const errText = (e) => formatErr(e?.response?.data?.detail) || e?.message || "Something went wrong";

const STATUS_LABEL = { pending_documents: "Documents pending", approved: "Approved", rejected: "Rejected" };
const STATUS_TONE = { pending_documents: "amber", approved: "green", rejected: "red" };
const DOC_LABEL = { pending: "Waiting for review", approved: "Approved", rejected: "Rejected" };
const DOC_TONE = { pending: "amber", approved: "green", rejected: "red" };

// Opens a data: URL in a new tab (blob URLs work where direct data: navigation is blocked).
function openDataUrl(dataUrl) {
    const [head, b64] = dataUrl.split(",");
    const mime = head.match(/data:(.*?);/)[1];
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
    window.open(url, "_blank", "noopener");
}

function Drawer({ title, onClose, children }) {
    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end" onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                data-testid="onboarding-drawer"
                className="w-full max-w-2xl h-full overflow-y-auto bg-[#0b0f19] border-l border-white/10 p-6 space-y-5"
            >
                <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl font-bold">{title}</h3>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

export default function ClubOnboarding({ onChanged }) {
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [reviewId, setReviewId] = useState(null);

    const load = useCallback(() => {
        setLoading(true);
        return api
            .get("/dev/applications")
            .then((r) => setApps(r.data))
            .catch((e) => toast.error(errText(e)))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const changed = () => {
        load();
        onChanged?.();
    };

    return (
        <>
            <Card
                title="Club applications"
                subtitle="A new club stays hidden, and its admin cannot create events, until every required document is approved and you approve the club here."
                action={
                    <Btn variant="primary" onClick={() => setCreating(true)} data-testid="new-application-btn">
                        <Plus className="w-4 h-4" /> New application
                    </Btn>
                }
            >
                {loading ? (
                    <div className="text-white/50 font-body text-sm">Loading…</div>
                ) : apps.length === 0 ? (
                    <Empty>No applications yet. Click New application to onboard a club.</Empty>
                ) : (
                    <div className="space-y-2" data-testid="application-list">
                        {apps.map((a) => (
                            <button
                                key={a.club_id}
                                type="button"
                                onClick={() => setReviewId(a.club_id)}
                                data-testid={`application-${a.club_id}`}
                                className="w-full text-left rounded-xl border border-white/10 p-3 hover:bg-white/5 flex flex-col md:flex-row md:items-center justify-between gap-2"
                            >
                                <div>
                                    <div className="font-body font-semibold">{a.trade_name}</div>
                                    <div className="font-body text-xs text-white/50">
                                        {a.city_name} · capacity {a.capacity ?? "—"} · documents {a.docs_approved}/{a.docs_required} approved
                                    </div>
                                </div>
                                <Badge tone={STATUS_TONE[a.status]}>{STATUS_LABEL[a.status] || a.status}</Badge>
                            </button>
                        ))}
                    </div>
                )}
            </Card>

            {creating && (
                <Drawer title="New club application" onClose={() => setCreating(false)}>
                    <ApplicationForm
                        onSaved={(clubId) => {
                            setCreating(false);
                            changed();
                            setReviewId(clubId);
                        }}
                    />
                </Drawer>
            )}

            {reviewId && <ReviewDrawer clubId={reviewId} onClose={() => setReviewId(null)} onChanged={changed} />}
        </>
    );
}

function ApplicationForm({ clubId, initial, onSaved }) {
    const [values, setValues] = useState(() => initial || {});
    const [errors, setErrors] = useState([]);
    const [saving, setSaving] = useState(false);
    const set = (k, v) => setValues((x) => ({ ...x, [k]: v }));

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors([]);
        try {
            const { data } = clubId
                ? await api.put(`/dev/applications/${clubId}`, values)
                : await api.post("/dev/applications", values);
            toast.success(clubId ? "Application updated" : "Application created. Now upload the documents.");
            onSaved(clubId || data.id);
        } catch (err) {
            const d = err?.response?.data?.detail;
            setErrors(Array.isArray(d) ? d : [errText(err)]);
        } finally {
            setSaving(false);
        }
    };

    const renderField = (f) => {
        const common = {
            value: values[f.key] ?? "",
            onChange: (e) => set(f.key, e.target.value),
            className: inputCls,
            "data-testid": `f-${f.key}`,
        };
        let input;
        if (f.type === "textarea") {
            input = <textarea rows={2} {...common} />;
        } else if (f.type === "select") {
            input = (
                <select {...common}>
                    <option value="" className="bg-[#0b0f19]">Choose…</option>
                    {f.options.map((o) => (
                        <option key={o} value={o} className="bg-[#0b0f19]">{o}</option>
                    ))}
                </select>
            );
        } else if (f.type === "city") {
            input = (
                <select {...common}>
                    <option value="" className="bg-[#0b0f19]">Choose…</option>
                    {CITIES.map((c) => (
                        <option key={c.slug} value={c.slug} className="bg-[#0b0f19]">{c.name}</option>
                    ))}
                </select>
            );
        } else {
            input = <input type={f.type || "text"} placeholder={f.placeholder} {...common} />;
        }
        return (
            <Field
                key={f.key}
                label={`${f.label}${f.req ? " *" : ""}`}
                hint={f.hint}
                className={f.type === "textarea" ? "md:col-span-2" : ""}
            >
                {input}
            </Field>
        );
    };

    return (
        <form onSubmit={submit} className="space-y-5" data-testid="application-form">
            {FIELD_GROUPS.map((g) => (
                <Card key={g.id} title={g.title}>
                    <div className="grid md:grid-cols-2 gap-4">{g.fields.map(renderField)}</div>
                </Card>
            ))}

            {errors.length > 0 && (
                <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 font-body text-sm text-red-200 space-y-1" data-testid="application-errors">
                    {errors.map((m, i) => (
                        <div key={i}>• {m}</div>
                    ))}
                </div>
            )}

            <div className="flex justify-end gap-3 pb-6">
                <Btn variant="primary" type="submit" disabled={saving} data-testid="application-save">
                    {clubId ? "Save changes" : "Create application"}
                </Btn>
            </div>
        </form>
    );
}

function ReviewDrawer({ clubId, onClose, onChanged }) {
    const [d, setD] = useState(null);
    const [editing, setEditing] = useState(false);
    const [reason, setReason] = useState("");
    const [busy, setBusy] = useState(false);

    const load = useCallback(() => {
        return api
            .get(`/dev/applications/${clubId}`)
            .then((r) => setD(r.data))
            .catch((e) => toast.error(errText(e)));
    }, [clubId]);

    useEffect(() => {
        load();
    }, [load]);

    const run = async (fn, okMsg) => {
        setBusy(true);
        try {
            await fn();
            toast.success(okMsg);
            await load();
            onChanged();
        } catch (e) {
            toast.error(errText(e));
        } finally {
            setBusy(false);
        }
    };

    const upload = (kind, file) => {
        if (!file) return;
        if (!DOC_MIME.includes(file.type)) return toast.error("Upload a JPG, PNG, WebP or PDF");
        if (file.size > MAX_DOC_BYTES) return toast.error("File must be under 3 MB");
        const reader = new FileReader();
        reader.onload = () =>
            run(
                () => api.post(`/dev/applications/${clubId}/documents`, { kind, file_name: file.name, data_url: reader.result }),
                "Document uploaded",
            );
        reader.readAsDataURL(file);
    };

    const decideDoc = (docId, action, note) =>
        run(() => api.patch(`/dev/applications/${clubId}/documents/${docId}`, { action, note }), `Document ${action === "approve" ? "approved" : action === "reject" ? "rejected" : "reset"}`);

    const view = async (docId) => {
        try {
            const { data } = await api.get(`/dev/applications/${clubId}/documents/${docId}`);
            openDataUrl(data.data_url);
        } catch (e) {
            toast.error(errText(e));
        }
    };

    if (!d) {
        return (
            <Drawer title="Application" onClose={onClose}>
                <div className="text-white/50 font-body text-sm">Loading…</div>
            </Drawer>
        );
    }

    if (editing) {
        return (
            <Drawer title="Edit application" onClose={() => setEditing(false)}>
                <ApplicationForm
                    clubId={clubId}
                    initial={d.application}
                    onSaved={() => {
                        setEditing(false);
                        load();
                        onChanged();
                    }}
                />
            </Drawer>
        );
    }

    const locked = d.status === "approved";

    return (
        <Drawer title={d.application.trade_name || "Application"} onClose={onClose}>
            <div className="flex flex-wrap items-center gap-2" data-testid="review-status">
                <Badge tone={STATUS_TONE[d.status]}>{STATUS_LABEL[d.status]}</Badge>
                <Badge>{d.club?.city} · capacity {d.club?.capacity}</Badge>
            </div>

            {d.reviewer_note && d.status === "rejected" && (
                <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 font-body text-sm text-red-200">
                    Rejected: {d.reviewer_note}
                </div>
            )}

            <Card title="Approval">
                {locked ? (
                    <p className="font-body text-sm text-white/70">
                        Approved. The club is live and its admin can create events. Reopen it to change anything.
                    </p>
                ) : (
                    <>
                        {d.blockers.length > 0 ? (
                            <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 mb-4" data-testid="blockers">
                                <div className="font-body text-sm font-semibold text-amber-200 mb-2">Not ready yet:</div>
                                <ul className="font-body text-sm text-amber-100 space-y-1">
                                    {d.blockers.map((b, i) => (
                                        <li key={i}>• {b}</li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <p className="font-body text-sm text-emerald-200 mb-4">All documents are approved and licences are valid.</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                            <Btn variant="good" disabled={busy || !d.can_approve} onClick={() => run(() => api.post(`/dev/applications/${clubId}/decision`, { action: "approve" }), "Club approved and live")} data-testid="approve-club">
                                <Check className="w-4 h-4" /> Approve club
                            </Btn>
                        </div>
                        <div className="mt-4 space-y-2">
                            <textarea
                                rows={2}
                                className={inputCls}
                                placeholder="Reason for rejecting the club (required)"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                            <Btn
                                variant="danger"
                                disabled={busy || reason.trim().length < 3}
                                onClick={() => run(() => api.post(`/dev/applications/${clubId}/decision`, { action: "reject", reason }), "Club rejected")}
                            >
                                <Ban className="w-4 h-4" /> Reject club
                            </Btn>
                        </div>
                    </>
                )}
                {d.status !== "pending_documents" && (
                    <div className="mt-4">
                        <Btn disabled={busy} onClick={() => run(() => api.post(`/dev/applications/${clubId}/decision`, { action: "reopen" }), "Club reopened for changes")}>
                            <RotateCcw className="w-4 h-4" /> Reopen
                        </Btn>
                    </div>
                )}
            </Card>

            <Card title="Documents" subtitle="* required. View each file, then approve or reject it.">
                <div className="space-y-3">
                    {DOCUMENTS.map((t) => {
                        const doc = d.documents.find((x) => x.kind === t.kind);
                        const expiry = t.expiry ? d.application[t.expiry] : "";
                        return (
                            <div key={t.kind} className="rounded-xl border border-white/10 p-3 space-y-2" data-testid={`doc-${t.kind}`}>
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="font-body text-sm font-semibold">
                                        {t.label}{" "}
                                        {t.req ? <span className="text-red-300">*</span> : <span className="text-white/40 text-xs">(optional)</span>}
                                    </div>
                                    {doc ? <Badge tone={DOC_TONE[doc.status]}>{DOC_LABEL[doc.status]}</Badge> : <Badge>Not uploaded</Badge>}
                                </div>
                                {expiry && <div className="font-body text-xs text-white/50">Expires {expiry}</div>}
                                {doc && <div className="font-body text-xs text-white/50 truncate">{doc.file_name}</div>}
                                {doc?.reviewer_note && <div className="font-body text-xs text-red-200">Reason: {doc.reviewer_note}</div>}
                                <div className="flex flex-wrap gap-2">
                                    {doc && (
                                        <Btn onClick={() => view(doc.id)}>
                                            <Eye className="w-4 h-4" /> View
                                        </Btn>
                                    )}
                                    {!locked && (
                                        <label className="inline-flex items-center gap-2 rounded-full px-4 py-2 font-body text-sm bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer">
                                            <Upload className="w-4 h-4" /> {doc ? "Replace" : "Upload"}
                                            <input
                                                type="file"
                                                accept={DOC_MIME.join(",")}
                                                className="hidden"
                                                onChange={(e) => {
                                                    upload(t.kind, e.target.files?.[0]);
                                                    e.target.value = "";
                                                }}
                                            />
                                        </label>
                                    )}
                                    {!locked && doc && doc.status !== "approved" && (
                                        <Btn variant="good" disabled={busy} onClick={() => decideDoc(doc.id, "approve")}>
                                            <Check className="w-4 h-4" /> Approve
                                        </Btn>
                                    )}
                                    {!locked && doc && doc.status !== "rejected" && (
                                        <Btn
                                            variant="danger"
                                            disabled={busy}
                                            onClick={() => {
                                                const note = window.prompt("Why is this document rejected? The club will see this.");
                                                if (note && note.trim().length >= 3) decideDoc(doc.id, "reject", note);
                                            }}
                                        >
                                            <Ban className="w-4 h-4" /> Reject
                                        </Btn>
                                    )}
                                    {!locked && doc && doc.status !== "pending" && (
                                        <Btn disabled={busy} onClick={() => decideDoc(doc.id, "reset")}>
                                            <RotateCcw className="w-4 h-4" /> Reset
                                        </Btn>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            <Card
                title="Details"
                action={
                    <Btn onClick={() => setEditing(true)} disabled={locked} data-testid="edit-application">
                        <Pencil className="w-4 h-4" /> Edit
                    </Btn>
                }
            >
                {locked && <p className="font-body text-xs text-white/50 mb-3">Reopen the club to edit details.</p>}
                <div className="space-y-4">
                    {FIELD_GROUPS.map((g) => {
                        const rows = g.fields.filter((f) => d.application[f.key]);
                        if (!rows.length) return null;
                        return (
                            <div key={g.id}>
                                <div className="font-body text-[11px] uppercase tracking-widest text-white/40 mb-1">{g.title}</div>
                                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 font-body text-sm">
                                    {rows.map((f) => (
                                        <div key={f.key}>
                                            <dt className="text-[11px] text-white/40">{f.label}</dt>
                                            <dd className="text-white/90 break-words">{d.application[f.key]}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>
                        );
                    })}
                </div>
            </Card>
        </Drawer>
    );
}
