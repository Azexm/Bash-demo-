"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useNav } from "@/lib/useNav";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { formatErr } from "@/lib/api";
import { homeFor } from "@/lib/roleHome";

export default function AuthPage({ mode = "login" }) {
    const { login, register } = useAuth();
    const nav = useNav();
    const sp = useSearchParams();
    const next = sp.get("next") || "/";

    const [email, setEmail] = useState(
        mode === "login" ? "test@bash.in" : "",
    );
    const [password, setPassword] = useState(
        mode === "login" ? "test1234" : "",
    );
    const [name, setName] = useState("");
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setErr("");
        setLoading(true);
        try {
            const u =
                mode === "login"
                    ? await login(email, password)
                    : await register(name, email, password);
            // a ?next= from a protected page wins; otherwise go to the role's own panel
            nav(sp.get("next") ? next : homeFor(u?.role));
        } catch (e) {
            setErr(formatErr(e.response?.data?.detail) || e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-5">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <Link
                    href="/"
                    className="flex items-center gap-2 justify-center mb-8"
                    data-testid="auth-brand-link"
                >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-display font-bold">
                        B
                    </div>
                    <span className="font-display text-2xl">Bash</span>
                </Link>

                <h1 className="font-display text-4xl font-bold tracking-tight text-center">
                    {mode === "login" ? "Welcome back." : "Join the party."}
                </h1>
                <p className="font-body text-white/60 text-center mt-2 mb-8">
                    {mode === "login"
                        ? "Sign in to see your tickets."
                        : "Create an account in seconds."}
                </p>

                <form onSubmit={submit} className="space-y-3">
                    {mode === "register" && (
                        <input
                            data-testid="auth-name"
                            placeholder="Full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3.5 font-body text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                        />
                    )}
                    <input
                        data-testid="auth-email"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3.5 font-body text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    />
                    <input
                        data-testid="auth-password"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3.5 font-body text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    />

                    {err && (
                        <div
                            data-testid="auth-error"
                            className="text-sm text-red-400 font-body"
                        >
                            {err}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        data-testid="auth-submit"
                        className="w-full rounded-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 font-display font-semibold hover:scale-[1.01] transition disabled:opacity-50"
                    >
                        {loading
                            ? "Please wait…"
                            : mode === "login"
                              ? "Sign in"
                              : "Create account"}
                    </button>
                </form>

                <div className="text-center mt-6 text-sm font-body text-white/60">
                    {mode === "login" ? (
                        <>
                            New to Bash?{" "}
                            <Link
                                href="/register"
                                className="text-purple-400 hover:text-purple-300"
                                data-testid="goto-register"
                            >
                                Create account
                            </Link>
                        </>
                    ) : (
                        <>
                            Already have an account?{" "}
                            <Link
                                href="/login"
                                className="text-purple-400 hover:text-purple-300"
                                data-testid="goto-login"
                            >
                                Sign in
                            </Link>
                        </>
                    )}
                </div>

                {mode === "login" && (
                    <div className="mt-8 rounded-xl bg-white/5 border border-white/10 p-4 text-xs font-body text-white/50 text-center">
                        Demo:{" "}
                        <span className="text-white/80">test@bash.in</span> /{" "}
                        <span className="text-white/80">test1234</span>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
