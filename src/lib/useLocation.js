"use client";
// Location for the whole app. On every page load the browser asks for location once;
// the GPS fix is mapped to the nearest city we run clubs in. The last city is remembered
// as a fallback, and Pune is the final default if location is refused.
import { useEffect, useState } from "react";
import { CITIES, DEFAULT_CITY, nearestCity } from "@/lib/geo";

const KEY = "bash_city";
let state = { city: null, status: "idle" }; // status: idle | asking | granted | denied | manual
const listeners = new Set();
let started = false;

const emit = (patch) => {
    state = { ...state, ...patch };
    listeners.forEach((fn) => fn(state));
};

const fallbackCity = () => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
    return CITIES.some((c) => c.slug === saved) ? saved : DEFAULT_CITY;
};

export function requestLocation() {
    if (typeof window === "undefined") return;
    if (!navigator.geolocation) {
        emit({ status: "denied", city: fallbackCity() });
        return;
    }
    emit({ status: "asking" });
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const c = nearestCity(pos.coords.latitude, pos.coords.longitude);
            localStorage.setItem(KEY, c.slug);
            emit({ city: c.slug, status: "granted" });
        },
        () => emit({ status: "denied", city: fallbackCity() }),
        { enableHighAccuracy: false, timeout: 12000, maximumAge: 10 * 60 * 1000 },
    );
}

export function setCity(slug) {
    localStorage.setItem(KEY, slug);
    emit({ city: slug, status: "manual" });
}

function start() {
    if (started) return;
    started = true;
    emit({ city: fallbackCity() });
    requestLocation();
}

export function useLocation() {
    const [s, setS] = useState(state);
    useEffect(() => {
        listeners.add(setS);
        start();
        return () => listeners.delete(setS);
    }, []);
    return s;
}
