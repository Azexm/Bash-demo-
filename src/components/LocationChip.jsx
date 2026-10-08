"use client";
import { MapPin, Loader2 } from "lucide-react";
import { CITIES, DEFAULT_CITY } from "@/lib/geo";
import { useLocation, requestLocation, setCity } from "@/lib/useLocation";

// Shown under the Bash logo: the detected city, a refresh button and a city switch.
export default function LocationChip({ className = "" }) {
    const { city, status } = useLocation();
    const slug = city || DEFAULT_CITY;
    const name = CITIES.find((c) => c.slug === slug)?.name || "Pune";

    return (
        <div className={`flex items-center gap-2 text-xs font-body text-white/60 ${className}`}>
            <button
                type="button"
                onClick={requestLocation}
                data-testid="location-chip"
                title="Use my current location"
                className="flex items-center gap-1.5 hover:text-white transition"
            >
                {status === "asking" ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                    <MapPin className="w-3 h-3" />
                )}
                <span data-testid="location-city">{name}</span>
            </button>
            {status === "denied" && <span className="text-white/40">· location off</span>}
            <select
                value={slug}
                onChange={(e) => setCity(e.target.value)}
                aria-label="Choose city"
                className="bg-transparent text-white/50 outline-none cursor-pointer"
            >
                {CITIES.map((c) => (
                    <option key={c.slug} value={c.slug} className="bg-[#0b0f19]">
                        {c.name}
                    </option>
                ))}
            </select>
        </div>
    );
}
