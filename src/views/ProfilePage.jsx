"use client";

import { useCallback, useEffect, useState } from "react";
import { useNav } from "@/lib/useNav";
import { toast } from "sonner";
import { Camera, Copy, Instagram, Pencil, Loader2, Check } from "lucide-react";
import AppShell from "@/components/AppShell";
import { Btn, inputCls } from "@/components/PanelUI";
import { api, formatErr } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const errText = (e) => formatErr(e?.response?.data?.detail) || e?.message || "Something went wrong";

export default function ProfilePage() {
    const { user, loading } = useAuth();
    const nav = useNav();
    const [profile, setProfile] = useState(null);
    const [igInput, setIgInput] = useState("");
    const [editingIg, setEditingIg] = useState(false);
    const [busy, setBusy] = useState(null); // "top" | "side" | "ig"

    useEffect(() => {
        if (!loading && !user) nav("/login?next=/profile");
    }, [loading, user, nav]);

    const load = useCallback(() => {
        return api
            .get("/profile")
            .then((r) => {
                setProfile(r.data);
                setIgInput(r.data.instagram ? `@${r.data.instagram}` : "");
            })
            .catch((e) => toast.error(errText(e)));
    }, []);

    useEffect(() => {
        if (user) load();
    }, [user, load]);

    const onPhoto = (slot, file) => {
        if (!file) return;
        if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return toast.error("Use a JPG, PNG or WebP photo");
        if (file.size > 2 * 1024 * 1024) return toast.error("Photo must be under 2 MB");
        const reader = new FileReader();
        reader.onload = async () => {
            setBusy(slot);
            try {
                const { data } = await api.post("/profile/photo", { slot, data_url: reader.result });
                setProfile(data);
                toast.success("Photo updated");
            } catch (e) {
                toast.error(errText(e));
            } finally {
                setBusy(null);
            }
        };
        reader.readAsDataURL(file);
    };

    const saveInstagram = async () => {
        setBusy("ig");
        try {
            const { data } = await api.patch("/profile", { instagram: igInput });
            setProfile(data);
            setIgInput(data.instagram ? `@${data.instagram}` : "");
            setEditingIg(false);
            toast.success(data.instagram ? "Instagram saved" : "Instagram removed");
        } catch (e) {
            toast.error(errText(e));
        } finally {
            setBusy(null);
        }
    };

    const copyId = () => {
        navigator.clipboard
            ?.writeText(profile.bash_id)
            .then(() => toast.success("Bash ID copied"))
            .catch(() => toast.error("Could not copy"));
    };

    if (loading || !user || !profile) {
        return (
            <AppShell>
                <div className="p-10 text-white/60 font-body">Loading…</div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <div className="max-w-5xl mx-auto px-5 md:px-10 py-8 space-y-6">
                <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">My Profile</h1>

                {/* Member card: same layout idea as the agenda ticket */}
                <div className="rounded-[32px] p-4 md:p-6 bg-gradient-to-br from-fuchsia-600/40 via-purple-700/30 to-pink-500/40 border border-white/10">
                    <div className="rounded-[26px] bg-[#e9e6e3] text-black p-5 md:p-7 grid md:grid-cols-[1.1fr_1fr] gap-7 shadow-2xl">
                        {/* LEFT: details */}
                        <div className="flex flex-col gap-5 min-w-0">
                            <div>
                                <div className="font-body text-[11px] uppercase tracking-widest text-black/50">Bash member</div>
                                <div className="font-display text-3xl md:text-4xl font-bold mt-1 break-words" data-testid="profile-name">
                                    {profile.name}
                                </div>
                            </div>

                            <Row label="Bash ID">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-lg font-bold tracking-wider" data-testid="profile-bash-id">
                                        {profile.bash_id}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={copyId}
                                        aria-label="Copy Bash ID"
                                        className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            </Row>

                            <Row label="Email">
                                <span className="font-body break-all" data-testid="profile-email">{profile.email}</span>
                            </Row>

                            <Row label={profile.id_type ? `${profile.id_type} number` : "ID number"}>
                                {profile.id_masked ? (
                                    <span className="font-mono" data-testid="profile-id-masked">{profile.id_masked}</span>
                                ) : (
                                    <span className="font-body text-sm text-black/50">
                                        Added automatically from your first ticket booking.
                                    </span>
                                )}
                            </Row>

                            <Row label="Instagram">
                                {profile.instagram && !editingIg ? (
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <a
                                            href={`https://www.instagram.com/${profile.instagram}/`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            data-testid="instagram-link"
                                            className="inline-flex items-center gap-2 rounded-full bg-black text-white px-4 py-2 font-body text-sm hover:scale-[1.02] transition"
                                        >
                                            <Instagram className="w-4 h-4" /> @{profile.instagram}
                                        </a>
                                        <button
                                            type="button"
                                            onClick={() => setEditingIg(true)}
                                            aria-label="Edit Instagram"
                                            className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2 flex-wrap">
                                        <input
                                            value={igInput}
                                            onChange={(e) => setIgInput(e.target.value)}
                                            placeholder="@yourname (optional)"
                                            data-testid="instagram-input"
                                            className={`${inputCls} bg-white text-black placeholder:text-black/40 max-w-xs`}
                                        />
                                        <Btn variant="primary" onClick={saveInstagram} disabled={busy === "ig"} data-testid="instagram-save">
                                            {busy === "ig" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save
                                        </Btn>
                                        {editingIg && (
                                            <Btn onClick={() => { setEditingIg(false); setIgInput(profile.instagram ? `@${profile.instagram}` : ""); }}>
                                                Cancel
                                            </Btn>
                                        )}
                                    </div>
                                )}
                            </Row>

                            <div className="font-body text-[11px] text-black/40">
                                Member since {profile.member_since ? new Date(profile.member_since).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                            </div>
                        </div>

                        {/* RIGHT: two editable photos */}
                        <div className="flex flex-col gap-4">
                            <PhotoSlot
                                src={profile.photo_top}
                                label="Top photo"
                                busy={busy === "top"}
                                onFile={(f) => onPhoto("top", f)}
                                className="aspect-[4/3] w-full"
                                testid="photo-top"
                            />
                            <PhotoSlot
                                src={profile.photo_side}
                                label="Side photo"
                                busy={busy === "side"}
                                onFile={(f) => onPhoto("side", f)}
                                className="aspect-[3/4] w-2/3 ml-auto"
                                testid="photo-side"
                            />
                        </div>
                    </div>
                </div>

                <p className="font-body text-xs text-white/40">
                    Photos are JPG, PNG or WebP, up to 2 MB. Your full ID number is never shown here; only the last digits.
                </p>
            </div>
        </AppShell>
    );
}

function Row({ label, children }) {
    return (
        <div>
            <div className="font-body text-[11px] uppercase tracking-widest text-black/50 mb-1.5">{label}</div>
            {children}
        </div>
    );
}

function PhotoSlot({ src, label, busy, onFile, className, testid }) {
    return (
        <div data-testid={testid} className={`relative rounded-2xl overflow-hidden bg-black/10 border border-black/10 ${className}`}>
            {src ? (
                <img src={src} alt={label} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full min-h-[120px] flex items-center justify-center font-body text-sm text-black/40">
                    No {label.toLowerCase()} yet
                </div>
            )}
            <label className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full bg-black/80 hover:bg-black text-white px-3 py-2 font-body text-xs cursor-pointer">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                {src ? "Change" : "Add"} photo
                <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                        onFile(e.target.files?.[0]);
                        e.target.value = "";
                    }}
                />
            </label>
        </div>
    );
}
