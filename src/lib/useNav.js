"use client";
import { useCallback } from "react";
import { useRouter } from "next/navigation";

// Drop-in replacement for react-router's useNavigate: nav("/path") or nav(-1)
export function useNav() {
    const router = useRouter();
    return useCallback(
        (to) => (typeof to === "number" ? router.back() : router.push(to)),
        [router],
    );
}
