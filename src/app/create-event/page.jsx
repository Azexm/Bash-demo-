"use client";

import { useEffect } from "react";
import { useNav } from "@/lib/useNav";

// Events are created by club admins in the Club Panel now.
export default function Page() {
    const nav = useNav();
    useEffect(() => {
        nav("/club");
    }, [nav]);
    return null;
}
