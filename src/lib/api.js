import axios from "axios";

// Requests go to /api/* on this Next.js app, which proxies to the backend (see next.config.js)
export const API = "/api";

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("bash_token");
        if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export function formatErr(detail) {
    if (!detail) return "Something went wrong";
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail))
        return detail.map((e) => e?.msg || JSON.stringify(e)).join(" ");
    if (detail?.msg) return detail.msg;
    return String(detail);
}

export const inr = (n) =>
    "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

// Resize hosted images (Unsplash / Pexels accept ?w=)
export function resizeImg(url, w) {
    try {
        const u = new URL(url);
        u.searchParams.set("w", String(w));
        return u.toString();
    } catch {
        return url;
    }
}
