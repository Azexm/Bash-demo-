"use client";

import { useMemo } from "react";
import { qrSvgPath } from "@/lib/qr";

// Renders `value` as a crisp, scalable QR code (SVG). Works on any background.
export default function QRCode({ value, className = "", label = "Ticket QR code" }) {
    const qr = useMemo(() => {
        try {
            return qrSvgPath(value, 3);
        } catch {
            return null;
        }
    }, [value]);
    if (!qr) return null;
    return (
        <svg
            viewBox={qr.viewBox}
            className={className}
            shapeRendering="crispEdges"
            role="img"
            aria-label={label}
        >
            <rect width="100%" height="100%" fill="#ffffff" />
            <path d={qr.path} fill="#0b0f19" />
        </svg>
    );
}
