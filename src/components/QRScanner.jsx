"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

// Reads QR codes from the camera.
// Uses the browser's built-in BarcodeDetector when it exists (Chrome/Edge). Otherwise
// it decodes each frame with jsQR, which works in every modern browser.
// The camera stops as soon as one code is read, and restarts when this component mounts again.
export default function QRScanner({ onCode }) {
    const videoRef = useRef(null);
    const onCodeRef = useRef(onCode);
    onCodeRef.current = onCode;
    const [message, setMessage] = useState("Starting camera…");

    useEffect(() => {
        if (!navigator.mediaDevices?.getUserMedia) {
            setMessage("Camera needs a secure (https) page. Use Type code instead.");
            return;
        }

        let stream = null;
        let timer = null;
        let done = false;
        const detector =
            typeof window !== "undefined" && "BarcodeDetector" in window
                ? new window.BarcodeDetector({ formats: ["qr_code"] })
                : null;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        const readFrame = async (video) => {
            if (detector) {
                const codes = await detector.detect(video);
                return codes[0]?.rawValue ?? null;
            }
            // jsQR on a downscaled frame: fast enough on phones
            const srcW = video.videoWidth;
            const srcH = video.videoHeight;
            if (!srcW || !srcH) return null;
            const scale = Math.min(1, 640 / srcW);
            canvas.width = Math.round(srcW * scale);
            canvas.height = Math.round(srcH * scale);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            return jsQR(img.data, canvas.width, canvas.height)?.data ?? null;
        };

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
                    let value = null;
                    try {
                        value = await readFrame(video);
                    } catch {
                        value = null; // a frame failed; try the next one
                    }
                    if (value && !done) {
                        done = true;
                        onCodeRef.current(value);
                    }
                }, 200);
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
