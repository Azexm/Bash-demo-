"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useNav } from "@/lib/useNav";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Calendar, Clock, Check } from "lucide-react";
import AppShell from "@/components/AppShell";
import { api, inr } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
    QuickInfo,
    SectionNav,
    LineupSection,
    GallerySection,
    ReviewsSection,
    FaqSection,
    LocationSection,
} from "@/components/EventSections";

export default function EventDetailPage() {
    const { id } = useParams();
    const nav = useNav();
    const { user } = useAuth();
    const [event, setEvent] = useState(null);
    const [tier, setTier] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/events/${id}`)
            .then((r) => {
                setEvent(r.data);
                setTier(r.data.tiers[r.data.tiers.length - 1]); // default VIP
            })
            .catch(() => setEvent(null))
            .finally(() => setLoading(false));
    }, [id]);

    const bookNow = () => {
        if (!user) {
            nav(`/login?next=/events/${id}`);
            return;
        }
        nav(`/book/${id}?tier=${encodeURIComponent(tier.name)}`);
    };

    if (loading)
        return (
            <AppShell>
                <div className="p-10 text-white/60">Loading…</div>
            </AppShell>
        );
    if (!event)
        return (
            <AppShell>
                <div className="p-10">Event not found</div>
            </AppShell>
        );

    return (
        <AppShell hideBottomNav>
            <div className="max-w-5xl mx-auto">
                {/* Hero */}
                <div className="relative h-[55vh] md:h-[70vh] overflow-hidden md:rounded-b-[48px]">
                    <img
                        src={event.hero_image || event.image}
                        alt={event.title}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#0b0f19]" />

                    <div className="relative z-10 flex items-start justify-between p-5 md:p-8">
                        <button
                            onClick={() => nav(-1)}
                            data-testid="back-btn"
                            className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/70"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        {event.is_live && (
                            <div className="rounded-full bg-[#ff3b30] text-white px-4 py-2 text-xs font-bold flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-white live-dot" />
                                LIVE
                            </div>
                        )}
                    </div>

                    <div className="absolute inset-x-5 md:inset-x-8 bottom-6 z-10">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="font-display text-5xl md:text-7xl font-bold tracking-tight"
                        >
                            {event.artist}
                        </motion.h1>
                        <p className="font-body text-base md:text-lg text-white/70 mt-1">
                            {event.subtitle}
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="px-5 md:px-8 pb-28 md:pb-10 pt-6">
                    {/* Tier selector */}
                    <h3 className="font-display text-sm uppercase tracking-widest text-white/50 mb-3">
                        Choose your tier
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                        {event.tiers.map((t) => (
                            <button
                                key={t.name}
                                data-testid={`tier-${t.name.toLowerCase()}`}
                                onClick={() => setTier(t)}
                                className={`text-left rounded-2xl p-4 border transition ${
                                    tier?.name === t.name
                                        ? "border-purple-400 bg-gradient-to-br from-blue-500/20 to-purple-600/20"
                                        : "border-white/10 bg-white/5 hover:bg-white/10"
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-display text-lg font-semibold">
                                        {t.name}
                                    </span>
                                    <span className="font-display text-xl font-bold">
                                        {inr(t.price)}
                                    </span>
                                </div>
                                <div className="text-xs text-white/60 font-body mt-1">
                                    {t.note}
                                </div>
                                {t.perks?.length > 0 && (
                                    <ul className="mt-3 space-y-1.5">
                                        {t.perks.map((perk) => (
                                            <li
                                                key={perk}
                                                className="flex items-start gap-2 text-xs text-white/70 font-body"
                                            >
                                                <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-purple-300" />
                                                {perk}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Venue chip */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        <div className="rounded-full bg-white/5 border border-white/10 px-4 py-2 flex items-center gap-2 font-body text-sm">
                            <MapPin className="w-4 h-4 text-white/60" />
                            {event.venue}, {event.city}
                        </div>
                        <div className="rounded-full bg-white/5 border border-white/10 px-4 py-2 flex items-center gap-2 font-body text-sm">
                            <Calendar className="w-4 h-4 text-white/60" />
                            {event.date}
                        </div>
                        <div className="rounded-full bg-white/5 border border-white/10 px-4 py-2 flex items-center gap-2 font-body text-sm">
                            <Clock className="w-4 h-4 text-white/60" />
                            {event.time}
                        </div>
                        <QuickInfo event={event} />
                    </div>

                    <p className="font-body text-white/70 leading-relaxed max-w-2xl mb-10">
                        {event.description}
                    </p>

                    <SectionNav event={event} />

                    {/* CTAs */}
                    <div className="fixed md:static bottom-0 left-0 right-0 p-5 md:p-0 bg-[#0b0f19]/95 md:bg-transparent backdrop-blur-xl md:backdrop-blur-0 border-t md:border-0 border-white/5 flex gap-3 z-30">
                        <button
                            onClick={bookNow}
                            data-testid="book-ticket-btn"
                            className="flex-1 rounded-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 font-display font-semibold text-white hover:scale-[1.01] transition shadow-lg shadow-purple-900/40"
                        >
                            Book Ticket · {inr(tier?.price || 0)}
                        </button>
                        <button
                            data-testid="view-seat-map-btn"
                            onClick={() => alert("Seat map coming soon")}
                            className="rounded-full px-6 border border-white/15 bg-white/5 font-body font-medium hover:bg-white/10 transition"
                        >
                            View Seat Map
                        </button>
                    </div>

                    <div className="mt-14 md:mt-16">
                        <LineupSection event={event} />
                        <GallerySection event={event} />
                        <ReviewsSection event={event} />
                        <FaqSection event={event} />
                        <LocationSection event={event} />
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
