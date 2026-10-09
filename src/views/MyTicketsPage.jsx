"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useNav } from "@/lib/useNav";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarPlus, Share2, ChevronRight } from "lucide-react";
import AppShell from "@/components/AppShell";
import TicketPass from "@/components/TicketPass";
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
        const d = new Date(t.event_date + " " + t.event_time);
        if (Number.isNaN(d.getTime())) {
            alert("Could not read this event's date for the calendar.");
            return;
        }
        const start = encodeURIComponent(d.toISOString().replace(/[-:]|\.\d{3}/g, ""));
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
                    <div className="space-y-10">
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
    const canShare = ticket.status === "approved" && ticket.ticket_code;
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.08 }}
            data-testid={`ticket-${ticket.id}`}
            className="mx-auto w-full max-w-md"
        >
            <TicketPass ticket={ticket} highlighted={highlighted} />

            <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                    data-testid={`add-cal-${ticket.id}`}
                    onClick={onCal}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-4 py-3.5 font-body text-sm hover:bg-white/10 transition"
                >
                    <CalendarPlus className="w-4 h-4" /> Add to Calendar
                </button>
                <button
                    data-testid={`share-ticket-${ticket.id}`}
                    onClick={onShare}
                    disabled={!canShare}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-4 py-3.5 font-body text-sm hover:bg-white/10 transition disabled:opacity-40 disabled:hover:bg-white/5"
                >
                    <Share2 className="w-4 h-4" /> Share
                </button>
            </div>
        </motion.div>
    );
}
