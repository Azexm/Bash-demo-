"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Calendar, Heart, MessageCircle, Send } from "lucide-react";
import { inr } from "@/lib/api";

export default function EventCard({ event, index = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            whileHover={{ y: -4 }}
            data-testid={`event-card-${event.id}`}
        >
            <Link
                href={`/events/${event.id}`}
                className="block relative rounded-3xl overflow-hidden h-[420px] sm:h-[460px] group"
            >
                <img
                    src={event.image}
                    alt={event.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />

                {/* Top row */}
                <div className="relative z-10 flex items-start justify-between p-5">
                    <div className="rounded-full bg-black/50 backdrop-blur-md border border-white/10 px-3 py-1.5 flex items-center gap-3 text-xs font-body">
                        <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-white/70" />
                            {event.city}
                        </span>
                        <span className="text-white/30">·</span>
                        <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-white/70" />
                            {event.date.split(" ").slice(0, 2).join(" ")}
                        </span>
                    </div>
                    {event.is_live && (
                        <div className="rounded-full bg-[#ff3b30] text-white px-3 py-1.5 text-xs font-bold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-white live-dot" />
                            LIVE
                        </div>
                    )}
                </div>

                <div className="absolute inset-x-5 bottom-5 z-10">
                    <h3 className="font-display text-4xl sm:text-5xl font-bold text-white leading-none">
                        {event.artist}
                    </h3>
                    <p className="font-body text-sm text-white/70 mt-1">
                        {event.subtitle}
                    </p>

                    <div className="flex items-end justify-between mt-5">
                        <div className="flex items-center gap-2">
                            <IconBtn testid={`fav-${event.id}`}>
                                <Heart className="w-4 h-4 text-[#ff3b30] fill-[#ff3b30]" />
                            </IconBtn>
                            <IconBtn testid={`chat-${event.id}`}>
                                <MessageCircle className="w-4 h-4 text-white/80" />
                            </IconBtn>
                            <IconBtn testid={`share-${event.id}`}>
                                <Send className="w-4 h-4 text-white/80" />
                            </IconBtn>
                        </div>
                        <div className="rounded-full bg-white/10 backdrop-blur-md border border-white/10 px-5 py-2.5">
                            <span className="font-body text-xs text-white/60">
                                From{" "}
                            </span>
                            <span className="font-display font-bold text-lg text-white">
                                {inr(event.tiers[0].price)}
                            </span>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

function IconBtn({ children, testid }) {
    return (
        <button
            data-testid={testid}
            onClick={(e) => e.preventDefault()}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/70 transition"
        >
            {children}
        </button>
    );
}
