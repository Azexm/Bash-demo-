"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useNav } from "@/lib/useNav";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    CalendarPlus,
    Share2,
    MapPin,
    Clock,
    ChevronRight,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { api, inr } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function MyTicketsPage() {
    const { user, loading: authLoading } = useAuth();
    const nav = useNav();
    const sp = useSearchParams();
    const highlight = sp.get("new");
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("upcoming");

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            nav("/login?next=/tickets");
            return;
        }
        api.get("/bookings/me")
            .then((r) => setTickets(r.data))
            .finally(() => setLoading(false));
    }, [user, authLoading, nav]);

    const filtered = tickets.filter(
        (t) => filter === "all" || ["approved", "pending"].includes(t.status),
    );

    const share = async (t) => {
        const text = `🎟 I'm going to ${t.event_title} at ${t.event_venue} on ${t.event_date}! Ticket: ${t.ticket_code}`;
        try {
            if (navigator.share) {
                await navigator.share({ title: "Bash Ticket", text });
            } else {
                await navigator.clipboard.writeText(text);
                alert("Ticket details copied!");
            }
        } catch {}
    };

    const addToCal = (t) => {
        const start = encodeURIComponent(
            new Date(t.event_date + " " + t.event_time)
                .toISOString()
                .replace(/[-:]|\.\d{3}/g, ""),
        );
        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(t.event_title)}&location=${encodeURIComponent(t.event_venue + ", " + t.event_city)}&dates=${start}/${start}`;
        window.open(url, "_blank");
    };

    return (
        <AppShell>
            <div className="max-w-3xl mx-auto px-5 md:px-10 py-6 md:py-10">
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => nav(-1)}
                        data-testid="tickets-back-btn"
                        className="md:hidden w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight">
                        My Tickets
                    </h1>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 px-5 py-3.5 mb-6">
                    <div className="flex gap-4 font-body text-sm">
                        <button
                            data-testid="filter-upcoming"
                            onClick={() => setFilter("upcoming")}
                            className={
                                filter === "upcoming"
                                    ? "text-white font-semibold"
                                    : "text-white/50"
                            }
                        >
                            Upcoming Events
                        </button>
                        <button
                            data-testid="filter-all"
                            onClick={() => setFilter("all")}
                            className={
                                filter === "all"
                                    ? "text-white font-semibold"
                                    : "text-white/50"
                            }
                        >
                            All
                        </button>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/40" />
                </div>

                {loading ? (
                    <div className="text-white/50 font-body">Loading…</div>
                ) : filtered.length === 0 ? (
                    <div
                        className="text-center py-20 text-white/50 font-body"
                        data-testid="no-tickets-msg"
                    >
                        No tickets yet.{" "}
                        <Link href="/" className="text-purple-400 underline">
                            Browse events
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filtered.map((t, i) => (
                            <TicketStub
                                key={t.id}
                                ticket={t}
                                index={i}
                                highlighted={t.id === highlight}
                                onShare={() => share(t)}
                                onCal={() => addToCal(t)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AppShell>
    );
}

function TicketStub({ ticket, index, highlighted, onShare, onCal }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.08 }}
            data-testid={`ticket-${ticket.id}`}
            className={`relative ${highlighted ? "ring-2 ring-purple-400 rounded-[32px]" : ""}`}
        >
            <div className="rounded-[32px] overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 ticket-stub">
                {/* Hero */}
                <div className="relative h-56 md:h-64 overflow-hidden">
                    <img
                        src={ticket.event_image}
                        alt={ticket.event_title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 via-transparent to-transparent" />
                    <div className="absolute top-4 right-4 rounded-full bg-black/50 backdrop-blur-md px-3 py-1.5 flex items-center gap-1.5 text-xs font-body">
                        <Clock className="w-3 h-3" /> {ticket.event_time}
                    </div>
                </div>

                {/* Body */}
                <div className="p-5 text-white">
                    <h3 className="font-display text-2xl font-bold">
                        {ticket.event_title}
                    </h3>
                    <StatusPill status={ticket.status} />
                    <div className="flex flex-wrap gap-3 mt-2 text-xs font-body text-white/80">
                        <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {ticket.event_city}
                        </span>
                        <span>·</span>
                        <span>{ticket.event_date}</span>
                        <span>·</span>
                        <span>
                            {ticket.tier} × {ticket.quantity}
                        </span>
                    </div>
                </div>

                {/* Perforation */}
                <div className="border-t-2 border-dashed border-white/30 mx-5" />

                {/* Barcode */}
                <div className="p-5 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] text-white/70 font-body uppercase tracking-widest">
                            Ticket code
                        </div>
                        <div className="font-mono text-sm text-white font-bold mt-1">
                            {ticket.ticket_code || STATUS_TEXT[ticket.status] || "PENDING"}
                        </div>
                    </div>
                    <div className="h-10 w-32 md:w-44 rounded barcode bg-white" />
                </div>
            </div>

            {/* Actions */}
            <div className="mt-4 space-y-3">
                <button
                    data-testid={`add-cal-${ticket.id}`}
                    onClick={onCal}
                    className="w-full flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 px-5 py-4 hover:bg-white/10 transition"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <CalendarPlus className="w-4 h-4" />
                        </div>
                        <span className="font-body">Add to Calendar</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/40" />
                </button>
                <button
                    data-testid={`share-ticket-${ticket.id}`}
                    onClick={onShare}
                    className="w-full flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 px-5 py-4 hover:bg-white/10 transition"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <Share2 className="w-4 h-4" />
                        </div>
                        <span className="font-body">Share Ticket</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/40" />
                </button>
            </div>
        </motion.div>
    );
}

const STATUS_TEXT = {
    awaiting_payment: "UNPAID",
    pending: "AWAITING APPROVAL",
    rejected: "REJECTED",
    cancelled: "CANCELLED",
};

const STATUS_STYLE = {
    approved: "bg-emerald-500/20 text-emerald-200 border-emerald-400/40",
    pending: "bg-amber-500/20 text-amber-200 border-amber-400/40",
    awaiting_payment: "bg-white/10 text-white/80 border-white/20",
    rejected: "bg-red-500/20 text-red-200 border-red-400/40",
    cancelled: "bg-red-500/20 text-red-200 border-red-400/40",
};

const STATUS_LABEL = {
    approved: "Approved",
    pending: "Awaiting club approval",
    awaiting_payment: "Payment pending",
    rejected: "Rejected by the club",
    cancelled: "Cancelled",
};

function StatusPill({ status }) {
    if (!status) return null;
    return (
        <div
            data-testid="ticket-status"
            className={`mt-3 inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-body ${STATUS_STYLE[status] || ""}`}
        >
            {STATUS_LABEL[status] || status}
        </div>
    );
}
