"use client";
// Shared building blocks for the Club, Gate and Developer panels.

export const inputCls =
    "w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 font-body text-sm text-white placeholder:text-white/30 outline-none focus:border-purple-400 transition";

export function Card({ title, subtitle, action, children, className = "" }) {
    return (
        <section className={`rounded-3xl border border-white/10 bg-white/5 p-5 md:p-6 ${className}`}>
            {(title || action) && (
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                        {title && <h2 className="font-display text-lg font-semibold">{title}</h2>}
                        {subtitle && <p className="font-body text-xs text-white/50 mt-1">{subtitle}</p>}
                    </div>
                    {action}
                </div>
            )}
            {children}
        </section>
    );
}

export function Field({ label, hint, children, className = "" }) {
    return (
        <label className={`block ${className}`}>
            <span className="block font-body text-[11px] uppercase tracking-widest text-white/50 mb-1.5">{label}</span>
            {children}
            {hint && <span className="block font-body text-[11px] text-white/40 mt-1">{hint}</span>}
        </label>
    );
}

const BTN = {
    primary: "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:scale-[1.02]",
    ghost: "bg-white/5 hover:bg-white/10 border border-white/10 text-white",
    good: "bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-100",
    danger: "bg-red-500/15 hover:bg-red-500/25 border border-red-400/30 text-red-100",
};

export function Btn({ variant = "ghost", className = "", type = "button", ...props }) {
    return (
        <button
            type={type}
            {...props}
            className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 font-body text-sm transition disabled:opacity-40 disabled:cursor-not-allowed ${BTN[variant]} ${className}`}
        />
    );
}

const TONE = {
    grey: "bg-white/5 text-white/70 border-white/15",
    green: "bg-emerald-500/15 text-emerald-200 border-emerald-400/30",
    amber: "bg-amber-500/15 text-amber-200 border-amber-400/30",
    red: "bg-red-500/15 text-red-200 border-red-400/30",
    blue: "bg-blue-500/15 text-blue-200 border-blue-400/30",
};

export function Badge({ tone = "grey", children, testid }) {
    return (
        <span
            data-testid={testid}
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-body whitespace-nowrap ${TONE[tone]}`}
        >
            {children}
        </span>
    );
}

export function Tabs({ tabs, value, onChange }) {
    return (
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {tabs.map((t) => (
                <button
                    key={t.id}
                    type="button"
                    onClick={() => onChange(t.id)}
                    data-testid={`tab-${t.id}`}
                    className={`shrink-0 rounded-full px-4 py-2 font-body text-sm border transition ${
                        value === t.id
                            ? "bg-white text-black border-white"
                            : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
                    }`}
                >
                    {t.label}
                </button>
            ))}
        </div>
    );
}

export function Empty({ children }) {
    return (
        <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center font-body text-sm text-white/50">
            {children}
        </div>
    );
}

export const fmtDateTime = (iso) =>
    iso
        ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })
        : "";
