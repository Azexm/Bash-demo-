"use client";

import { useEffect, useRef, useState } from "react";

// Reads QR codes from the camera with the browser's built-in BarcodeDetector.
// Supported in Chrome and Edge (Android and desktop). Where it is missing, the
// gate uses "Type code" instead. The camera stops as soon as one code is read,
// and it restarts when this component is mounted again.
export default function QRScanner({ onCode }) {
    const videoRef = useRef(null);
    const onCodeRef = useRef(onCode);
    onCodeRef.current = onCode;
    const [message, setMessage] = useState("Starting camera…");

    useEffect(() => {
        if (typeof window === "undefined" || !("BarcodeDetector" in window)) {
            setMessage("This browser cannot read QR codes from the camera. Use Chrome or Edge, or switch to Type code.");
            return;
        }

        let stream = null;
        let timer = null;
        let done = false;
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });

        (async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: "environment" } },
                    audio: false,
                });
                if (done) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }
                const video = videoRef.current;
                video.srcObject = stream;
                await video.play();
                setMessage("Point the camera at the guest's QR code");

                timer = setInterval(async () => {
                    if (done || video.readyState < 2) return;
                    try {
                        const codes = await detector.detect(video);
                        if (codes.length && !done) {
                            done = true;
                            onCodeRef.current(codes[0].rawValue);
                        }
                    } catch {
                        /* a frame failed to decode; try the next one */
                    }
                }, 250);
            } catch {
                setMessage("Camera unavailable. Allow camera access, or use Type code.");
            }
        })();

        return () => {
            done = true;
            clearInterval(timer);
            if (stream) stream.getTracks().forEach((t) => t.stop());
        };
    }, []);

    return (
        <div className="relative rounded-3xl overflow-hidden bg-black border border-white/10 aspect-[3/4] md:aspect-video max-h-[70vh] mx-auto w-full">
            <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                data-testid="gate-camera"
                className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-3/5 aspect-square rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
            </div>
            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-center font-body text-sm text-white/90">
                {message}
            </div>
        </div>
    );
}
