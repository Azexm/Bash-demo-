"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    DoorOpen,
    ExternalLink,
    Hourglass,
    Car,
    Navigation,
    ShieldCheck,
    Star,
    X,
} from "lucide-react";
import { resizeImg } from "@/lib/api";

const chip =
    "rounded-full bg-white/5 border border-white/10 px-4 py-2 flex items-center gap-2 font-body text-sm";

function Section({ id, title, aside, children }) {
    return (
        <section id={id} className="scroll-mt-24 mb-12" data-testid={`section-${id}`}>
            <div className="flex items-end justify-between gap-4 mb-4">
                <h3 className="font-display text-2xl font-semibold">{title}</h3>
                {aside}
            </div>
            {children}
        </section>
    );
}

function Avatar({ name, src, className }) {
    const [failed, setFailed] = useState(false);
    const initials = name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();

    if (!src || failed) {
        return (
            <div
                className={`${className} bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-display text-3xl font-bold`}
            >
                {initials}
            </div>
        );
    }
    return (
        <img
            src={resizeImg(src, 400)}
            alt={name}
            loading="lazy"
            onError={() => setFailed(true)}
            className={`${className} object-cover`}
        />
    );
}

function Stars({ value, size = "w-4 h-4" }) {
    return (
        <div className="flex items-center gap-0.5" aria-label={`${value} out of 5`}>
            {[1, 2, 3, 4, 5].map((n) => (
                <Star
                    key={n}
                    className={`${size} ${
                        n <= Math.round(value)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-white/20"
                    }`}
                />
            ))}
        </div>
    );
}

/* ---------- Quick info chips (rendered inside the venue chip row) ---------- */
export function QuickInfo({ event }) {
    const i = event.info;
    if (!i) return null;
    return (
        <>
            {i.age_limit && (
                <div className={chip} data-testid="info-age">
                    <ShieldCheck className="w-4 h-4 text-white/60" />
                    {i.age_limit}
                </div>
            )}
            {i.doors_open && (
                <div className={chip} data-testid="info-doors">
                    <DoorOpen className="w-4 h-4 text-white/60" />
                    Doors {i.doors_open}
                </div>
            )}
            {i.duration && (
                <div className={chip} data-testid="info-duration">
                    <Hourglass className="w-4 h-4 text-white/60" />
                    {i.duration}
                </div>
            )}
        </>
    );
}

/* ---------- Jump links ---------- */
export function SectionNav({ event }) {
    const links = [
        event.lineup?.length && ["lineup", "Lineup"],
        event.gallery?.length && ["gallery", "Gallery"],
        ["reviews", "Reviews"],
        event.faqs?.length && ["faq", "FAQ"],
        ["location", "Location"],
    ].filter(Boolean);

    return (
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 md:mx-0 md:px-0 mb-8">
            {links.map(([id, label]) => (
                <a
                    key={id}
                    href={`#${id}`}
                    data-testid={`jump-${id}`}
                    className="shrink-0 rounded-full px-4 py-2 font-body text-sm border bg-white/5 text-white/80 border-white/10 hover:bg-white/10 transition"
                >
                    {label}
                </a>
            ))}
        </div>
    );
}

/* ---------- Artist lineup ---------- */
export function LineupSection({ event }) {
    const lineup = event.lineup || [];
    if (!lineup.length) return null;
    return (
        <Section id="lineup" title="Artist lineup">
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-5 px-5 md:mx-0 md:px-0">
                {lineup.map((a, i) => (
                    <div
                        key={`${a.name}-${i}`}
                        data-testid={`lineup-${i}`}
                        className="shrink-0 w-40 md:w-44"
                    >
                        <div className="relative">
                            <Avatar
                                name={a.name}
                                src={a.photo}
                                className="w-40 h-40 md:w-44 md:h-44 rounded-3xl border border-white/10"
                            />
                            {a.role === "Headliner" && (
                                <span className="absolute top-2 left-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                                    Headliner
                                </span>
                            )}
                        </div>
                        <div className="mt-3 font-display text-lg font-semibold leading-tight">
                            {a.name}
                        </div>
                        <div className="font-body text-xs text-white/60 mt-0.5">
                            {a.role !== "Headliner" && a.role}
                            {a.role !== "Headliner" && a.set_time && " · "}
                            {a.set_time}
                        </div>
                    </div>
                ))}
            </div>
        </Section>
    );
}

/* ---------- Gallery + lightbox ---------- */
export function GallerySection({ event }) {
    const images = event.gallery || [];
    const [open, setOpen] = useState(null);

    const close = useCallback(() => setOpen(null), []);
    const step = useCallback(
        (d) => setOpen((i) => (i === null ? i : (i + d + images.length) % images.length)),
        [images.length],
    );

    useEffect(() => {
        if (open === null) return;
        const onKey = (e) => {
            if (e.key === "Escape") close();
            if (e.key === "ArrowLeft") step(-1);
            if (e.key === "ArrowRight") step(1);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, close, step]);

    if (!images.length) return null;

    return (
        <Section id="gallery" title="Gallery">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {images.map((src, i) => (
                    <button
                        key={`${src}-${i}`}
                        onClick={() => setOpen(i)}
                        data-testid={`gallery-${i}`}
                        className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 group"
                    >
                        <img
                            src={resizeImg(src, 700)}
                            alt={`${event.title} photo ${i + 1}`}
                            loading="lazy"
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    </button>
                ))}
            </div>

            <AnimatePresence>
                {open !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={close}
                        data-testid="lightbox"
                        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <button
                            onClick={close}
                            aria-label="Close"
                            data-testid="lightbox-close"
                            className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        step(-1);
                                    }}
                                    aria-label="Previous"
                                    className="absolute left-3 md:left-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        step(1);
                                    }}
                                    aria-label="Next"
                                    className="absolute right-3 md:right-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </>
                        )}
                        <img
                            src={resizeImg(images[open], 1600)}
                            alt={`${event.title} photo ${open + 1}`}
                            onClick={(e) => e.stopPropagation()}
                            className="max-h-[85vh] max-w-full rounded-2xl object-contain"
                        />
                        <div className="absolute bottom-5 font-body text-xs text-white/60">
                            {open + 1} / {images.length}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Section>
    );
}

/* ---------- Guest reviews ---------- */
export function ReviewsSection({ event }) {
    const reviews = event.reviews || [];
    const avg = reviews.length
        ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length
        : 0;

    return (
        <Section
            id="reviews"
            title="Guest reviews"
            aside={
                reviews.length > 0 && (
                    <div className="flex items-center gap-2" data-testid="review-summary">
                        <span className="font-display text-2xl font-bold">
                            {avg.toFixed(1)}
                        </span>
                        <div>
                            <Stars value={avg} size="w-3.5 h-3.5" />
                            <div className="font-body text-[11px] text-white/50">
                                {reviews.length} review{reviews.length > 1 && "s"}
                            </div>
                        </div>
                    </div>
                )
            }
        >
            {reviews.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 font-body text-sm text-white/60">
                    No guest reviews yet.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {reviews.map((r, i) => (
                        <div
                            key={`${r.name}-${i}`}
                            data-testid={`review-${i}`}
                            className="rounded-2xl border border-white/10 bg-white/5 p-5"
                        >
                            <Stars value={r.rating} />
                            <p className="font-body text-sm text-white/80 leading-relaxed mt-3">
                                {r.comment}
                            </p>
                            <div className="font-body text-xs text-white/50 mt-4">
                                {r.name}
                                {r.date && ` · ${r.date}`}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Section>
    );
}

/* ---------- FAQ accordion ---------- */
export function FaqSection({ event }) {
    const faqs = event.faqs || [];
    const [openIdx, setOpenIdx] = useState(0);
    if (!faqs.length) return null;

    return (
        <Section id="faq" title="FAQ">
            <div className="rounded-3xl border border-white/10 bg-white/5 divide-y divide-white/10 overflow-hidden">
                {faqs.map((f, i) => {
                    const isOpen = openIdx === i;
                    return (
                        <div key={`${f.q}-${i}`} data-testid={`faq-${i}`}>
                            <button
                                onClick={() => setOpenIdx(isOpen ? null : i)}
                                aria-expanded={isOpen}
                                className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 hover:bg-white/5 transition"
                            >
                                <span className="font-display text-base font-medium">
                                    {f.q}
                                </span>
                                <ChevronDown
                                    className={`w-5 h-5 shrink-0 text-white/60 transition-transform ${
                                        isOpen ? "rotate-180" : ""
                                    }`}
                                />
                            </button>
                            <AnimatePresence initial={false}>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <p className="px-5 pb-5 font-body text-sm text-white/70 leading-relaxed">
                                            {f.a}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </Section>
    );
}

/* ---------- Location + map ---------- */
export function LocationSection({ event }) {
    const loc = event.location || {};
    const address = loc.address || `${event.venue}, ${event.city}`;
    const q = encodeURIComponent(address);

    return (
        <Section
            id="location"
            title="Location"
            aside={
                <a
                    href={`https://www.google.com/maps/search/?api=1&query=${q}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="open-in-maps"
                    className="flex items-center gap-1.5 font-body text-sm text-white/70 hover:text-white"
                >
                    Open in Maps <ExternalLink className="w-3.5 h-3.5" />
                </a>
            }
        >
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2 space-y-4 font-body text-sm">
                    <div>
                        <div className="font-display text-lg font-semibold">
                            {event.venue}
                        </div>
                        <div className="text-white/70 mt-1">{address}</div>
                    </div>
                    {loc.getting_there && (
                        <div className="flex gap-3">
                            <Navigation className="w-4 h-4 mt-0.5 shrink-0 text-white/50" />
                            <div>
                                <div className="text-white/50 text-xs uppercase tracking-widest mb-1">
                                    Getting there
                                </div>
                                <p className="text-white/80 leading-relaxed">
                                    {loc.getting_there}
                                </p>
                            </div>
                        </div>
                    )}
                    {loc.parking && (
                        <div className="flex gap-3">
                            <Car className="w-4 h-4 mt-0.5 shrink-0 text-white/50" />
                            <div>
                                <div className="text-white/50 text-xs uppercase tracking-widest mb-1">
                                    Parking
                                </div>
                                <p className="text-white/80 leading-relaxed">
                                    {loc.parking}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
                <iframe
                    title={`Map of ${event.venue}`}
                    src={`https://www.google.com/maps?q=${q}&output=embed`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    data-testid="location-map"
                    className="md:col-span-3 w-full h-64 md:h-80 rounded-3xl border border-white/10 bg-white/5"
                />
            </div>
        </Section>
    );
}
