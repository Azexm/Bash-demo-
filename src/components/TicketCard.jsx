"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Clock, Lock, QrCode, X, Maximize2, CheckCircle2 } from "lucide-react";
import QRCode from "@/components/QRCode";

export const STATUS_STYLE = {
    approved: "bg-emerald-500/25 text-emerald-100 border-emerald-300/40",
    pending: "bg-amber-500/25 text-amber-100 border-amber-300/40",
    awaiting_payment: "bg-white/15 text-white border-white/30",
    rejected: "bg-red-500/25 text-red-100 border-red-300/40",
    cancelled: "bg-red-500/25 text-red-100 border-red-300/40",
};

export const STATUS_LABEL = {
    approved: "Confirmed",
    pending: "Awaiting club approval",
    awaiting_payment: "Payment pending",
    rejected: "Rejected by the club",
    cancelled: "Cancelled",
};

// What to show in the QR slot when there is no usable QR.
export const LOCKED_TEXT = {
    awaiting_payment: "Complete payment to get your QR",
    pending: "Your QR unlocks once the club approves",
    rejected: "This ticket was rejected",
    cancelled: "This ticket was cancelled",
};

/**
 * The QR itself, or a locked / admitted state. Shared by both ticket designs.
 * `sizeClass` sets the box size (e.g. "h-44 w-44"); `compact` shrinks the text for small boxes.
 */
export function QRSlot({ ticket, sizeClass, compact = false, onOpen }) {
    const used = Boolean(ticket.used_at);
    const hasQR = ticket.ticket_code && ticket.status === "approved";

    if (!hasQR) {
        return (
            <div
                data-testid="qr-locked"
                className={`${sizeClass} flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-2 text-center text-slate-400`}
            >
                <div className="relative">
                    <QrCode className={compact ? "h-9 w-9 opacity-30" : "h-16 w-16 opacity-30"} />
                    <Lock
                        className={`absolute -bottom-1 -right-1 rounded-full bg-slate-100 p-1 text-slate-500 ${compact ? "h-4 w-4" : "h-6 w-6"}`}
                    />
                </div>
                <p className={`font-body leading-snug ${compact ? "mt-1.5 text-[9px]" : "mt-3 text-xs"}`}>
                    {LOCKED_TEXT[ticket.status] || "QR not available"}
                </p>
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={onOpen}
            data-testid={`qr-open-${ticket.id}`}
            aria-label="Enlarge QR code"
            className="group relative rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm"
        >
            <QRCode value={ticket.ticket_code} className={`${sizeClass} ${used ? "opacity-20" : ""}`} />
            {used ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-emerald-600">
                    <CheckCircle2 className={compact ? "h-6 w-6" : "h-9 w-9"} />
                    <span className={`mt-0.5 font-display font-bold tracking-wide ${compact ? "text-xs" : "text-lg"}`}>
                        ADMITTED
                    </span>
                    <span className="text-[10px] font-body text-slate-500">
                        {new Date(ticket.used_at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                    </span>
                </div>
            ) : (
                <span className="absolute bottom-2 right-2 rounded-full bg-slate-900/80 p-1 text-white opacity-90">
                    <Maximize2 className={compact ? "w-2.5 h-2.5" : "w-3.5 h-3.5"} />
                </span>
            )}
        </button>
    );
}

const Field = ({ label, value, className = "" }) => (
    <div className={className}>
        <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400 font-body">{label}</div>
        <div className="mt-0.5 text-[15px] font-semibold text-slate-900 font-body leading-snug break-words">
            {value || "—"}
        </div>
    </div>
);

/**
 * Purchase-style ticket (blue/purple reference): event image + details on top,
 * perforation, QR stub underneath. Used on the booking confirmation screen.
 */
export default function TicketCard({ ticket, highlighted = false }) {
    const [zoom, setZoom] = useState(false);
    const live = ticket.status === "approved" && Boolean(ticket.ticket_code) && !ticket.used_at;

    return (
        <>
            <div
                data-testid={`ticket-card-${ticket.id}`}
                className="relative"
                style={highlighted ? { filter: "drop-shadow(0 0 14px rgba(168,85,247,0.65))" } : undefined}
            >
                <div className="ticket-top overflow-hidden rounded-t-[28px] bg-white">
                    <div className="relative h-52 md:h-60">
                        {ticket.event_image ? (
                            <img src={ticket.event_image} alt={ticket.event_title} className="h-full w-full object-cover" />
                        ) : (
                            <div className="h-full w-full bg-gradient-to-br from-blue-500 to-purple-600" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/90 via-indigo-900/20 to-indigo-600/30" />

                        <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2">
                            <span
                                data-testid="ticket-status"
                                className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-body backdrop-blur-md ${STATUS_STYLE[ticket.status] || "bg-black/40 text-white border-white/20"}`}
                            >
                                {STATUS_LABEL[ticket.status] || ticket.status}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-md px-3 py-1 text-[11px] font-body text-white">
                                <Clock className="w-3 h-3" /> {ticket.event_time}
                            </span>
                        </div>

                        <div className="absolute bottom-4 left-5 right-5 text-white">
                            <div className="text-[10px] uppercase tracking-[0.2em] text-white/70 font-body">
                                {ticket.tier} pass
                            </div>
                            <h3 className="font-display text-2xl md:text-3xl font-bold leading-tight mt-0.5">
                                {ticket.event_title}
                            </h3>
                        </div>
                    </div>

                    <div className="px-6 pt-5 pb-6 grid grid-cols-3 gap-x-4 gap-y-4">
                        <Field label="Date" value={ticket.event_date} className="col-span-2" />
                        <Field label="Time" value={ticket.event_time} />
                        <Field label="Venue" value={ticket.event_venue} className="col-span-2" />
                        <Field label="City" value={ticket.event_city} />
                        <Field label="Name" value={ticket.attendee_name} className="col-span-2" />
                        <Field label="Admits" value={`${ticket.quantity} ${ticket.quantity > 1 ? "people" : "person"}`} />
                    </div>
                </div>

                <div className="ticket-bottom relative rounded-b-[28px] bg-white px-6 pb-6 pt-7">
                    <div className="absolute left-7 right-7 top-0 border-t-2 border-dashed border-slate-300" />
                    <div className="flex flex-col items-center">
                        <QRSlot
                            ticket={ticket}
                            sizeClass="h-44 w-44 md:h-48 md:w-48"
                            onOpen={() => setZoom(true)}
                        />
                        <div className="mt-4 text-[10px] uppercase tracking-[0.2em] text-slate-400 font-body">
                            Ticket code
                        </div>
                        <div className="mt-1 font-mono text-lg font-bold tracking-[0.18em] text-slate-900">
                            {ticket.ticket_code || "— — — —"}
                        </div>
                        {live && <p className="mt-2 text-xs text-slate-500 font-body">Show this QR at the gate</p>}
                    </div>
                </div>
            </div>

            {zoom && <QRModal ticket={ticket} onClose={() => setZoom(false)} />}
        </>
    );
}

// Full-screen QR for scanning. Rendered in a portal so the card's animation can't affect it.
export function QRModal({ ticket, onClose }) {
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [onClose]);

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            role="dialog"
            aria-modal="true"
            aria-label="Ticket QR code"
            onClick={onClose}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-5"
        >
            <motion.div
                initial={{ scale: 0.95, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-sm rounded-3xl bg-white p-6 text-center"
            >
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700"
                >
                    <X className="h-4 w-4" />
                </button>
                <div className="font-display text-xl font-bold text-slate-900 pr-8 text-left">{ticket.event_title}</div>
                <div className="text-left text-xs text-slate-500 font-body mt-0.5">
                    {ticket.attendee_name} · {ticket.tier} × {ticket.quantity}
                </div>
                <QRCode value={ticket.ticket_code} className="mx-auto mt-5 w-full max-w-[300px]" />
                <div className="mt-4 font-mono text-xl font-bold tracking-[0.18em] text-slate-900">
                    {ticket.ticket_code}
                </div>
                <p className="mt-1 text-xs text-slate-500 font-body">Tap outside to close</p>
            </motion.div>
        </motion.div>,
        document.body,
    );
}
