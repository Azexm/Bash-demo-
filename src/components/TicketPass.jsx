"use client";

import { useState } from "react";
import { STATUS_STYLE, STATUS_LABEL, QRSlot, QRModal } from "@/components/TicketCard";

const PURPLE = "#c04fd8";

// "Neon Nights Pune" -> ["Neon Nights", "Pune"] so the title can be two-tone.
function splitTitle(title = "") {
    const words = String(title).trim().split(/\s+/).filter(Boolean);
    if (words.length < 2) return [words.join(" "), ""];
    const cut = Math.ceil(words.length / 2);
    return [words.slice(0, cut).join(" "), words.slice(cut).join(" ")];
}

/**
 * "My Tickets" card: pearl-grey pass with the QR and a vertical tier label up top,
 * the event's headline image, a perforation, then a bold two-tone title,
 * a details box and a second crop of the image.
 */
export default function TicketPass({ ticket, highlighted = false }) {
    const [zoom, setZoom] = useState(false);
    const [a, b] = splitTitle(ticket.event_title);
    const used = Boolean(ticket.used_at);
    const people = `${ticket.quantity} ${ticket.quantity > 1 ? "people" : "person"}`;

    return (
        <>
            <div
                data-testid={`ticket-pass-${ticket.id}`}
                className="relative"
                style={highlighted ? { filter: "drop-shadow(0 0 16px rgba(192,79,216,0.7))" } : undefined}
            >
                {/* ---------- top: QR + label + headline image ---------- */}
                <div className="ticket-top rounded-t-[28px] bg-gradient-to-br from-[#ecebe8] to-[#d3d0cb] p-4 pb-7">
                    <div className="flex items-stretch gap-3">
                        <div className="flex w-[112px] shrink-0 flex-col items-center gap-2">
                            <QRSlot ticket={ticket} sizeClass="h-24 w-24" compact onOpen={() => setZoom(true)} />
                            <div className="text-center font-mono text-[10px] font-bold tracking-[0.12em] text-slate-700">
                                {ticket.ticket_code || "— — — —"}
                            </div>
                            {!used && ticket.status === "approved" && (
                                <div className="text-center text-[9px] uppercase tracking-wider text-slate-500 font-body">
                                    Tap to enlarge
                                </div>
                            )}
                        </div>

                        <div
                            className="flex w-7 shrink-0 items-center justify-center rounded-md"
                            style={{ backgroundColor: PURPLE }}
                        >
                            <span className="rotate-180 whitespace-nowrap font-display text-xs font-bold uppercase tracking-[0.22em] text-black [writing-mode:vertical-rl]">
                                * {ticket.tier} pass *
                            </span>
                        </div>

                        <div className="relative min-h-[150px] flex-1 overflow-hidden rounded-xl bg-slate-300">
                            {ticket.event_image && (
                                <img
                                    src={ticket.event_image}
                                    alt={ticket.event_title}
                                    className="absolute inset-0 h-full w-full object-cover"
                                />
                            )}
                            <span
                                data-testid="ticket-status"
                                className={`absolute left-2 top-2 inline-flex max-w-[calc(100%-1rem)] items-center rounded-full border px-2.5 py-0.5 text-[10px] font-body backdrop-blur-md ${STATUS_STYLE[ticket.status] || "bg-black/40 text-white border-white/20"}`}
                            >
                                {STATUS_LABEL[ticket.status] || ticket.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ---------- bottom: title + details + second crop ---------- */}
                <div className="ticket-bottom relative rounded-b-[28px] bg-gradient-to-br from-[#e4e2de] to-[#cdcac5] px-4 pb-4 pt-7">
                    <div className="absolute left-7 right-7 top-0 border-t-2 border-dashed border-slate-500/50" />

                    <div className="flex gap-3">
                        <div className="min-w-0 flex-1">
                            <h3 className="font-display text-[26px] font-bold uppercase leading-[0.95] tracking-tight text-slate-900 md:text-[30px]">
                                {a}
                                {b && <span className="text-slate-400"> {b}</span>}
                            </h3>
                            <div className="mt-1 h-[2px] w-full bg-slate-900" />

                            <div className="mt-3 rounded-2xl border border-slate-500/60 bg-white/30 p-3">
                                <Row top={ticket.event_date} right={ticket.event_city} bottom={ticket.event_venue} />
                                <Row top={ticket.event_time} right={people} bottom={ticket.attendee_name} className="mt-2.5" />
                            </div>
                        </div>

                        <div className="relative w-[34%] max-w-[150px] shrink-0 overflow-hidden rounded-xl bg-slate-300">
                            {ticket.event_image && (
                                <img
                                    src={ticket.event_image}
                                    alt=""
                                    aria-hidden="true"
                                    className="absolute inset-0 h-full w-full object-cover object-[75%_center]"
                                />
                            )}
                        </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-wide text-slate-600 font-body">
                        <span className="h-3.5 w-3.5 shrink-0" style={{ backgroundColor: PURPLE }} />
                        <span className="truncate">
                            bash / tickets / {ticket.ticket_code || (STATUS_LABEL[ticket.status] || ticket.status)}
                        </span>
                    </div>
                </div>
            </div>

            {zoom && <QRModal ticket={ticket} onClose={() => setZoom(false)} />}
        </>
    );
}

function Row({ top, right, bottom, className = "" }) {
    return (
        <div className={className}>
            <div className="flex items-baseline justify-between gap-2">
                <span className="font-body text-[15px] font-semibold text-slate-900">{top || "—"}</span>
                <span className="truncate font-display text-[15px] font-bold uppercase text-slate-900">{right || ""}</span>
            </div>
            <div className="truncate text-[11px] uppercase tracking-wide text-slate-600 font-body">{bottom || ""}</div>
        </div>
    );
}
