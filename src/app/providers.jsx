"use client";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";

export default function Providers({ children }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: { staleTime: 60_000, refetchOnWindowFocus: false },
                },
            }),
    );
    return (
        <QueryClientProvider client={queryClient}>
            <div className="App">
                <AuthProvider>
                    {children}
                    <Toaster theme="dark" position="top-right" />
                </AuthProvider>
            </div>
        </QueryClientProvider>
    );
}
