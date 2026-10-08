"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api, formatErr } from "@/lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("bash_token");
        if (!token) {
            setLoading(false);
            return;
        }
        api.get("/auth/me")
            .then((r) => setUser(r.data))
            .catch(() => localStorage.removeItem("bash_token"))
            .finally(() => setLoading(false));
    }, []);

    const login = async (email, password) => {
        const { data } = await api.post("/auth/login", { email, password });
        localStorage.setItem("bash_token", data.token);
        setUser(data.user);
        return data.user;
    };

    const register = async (name, email, password) => {
        const { data } = await api.post("/auth/register", {
            name,
            email,
            password,
        });
        localStorage.setItem("bash_token", data.token);
        setUser(data.user);
        return data.user;
    };

    const logout = () => {
        localStorage.removeItem("bash_token");
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{ user, loading, login, register, logout, formatErr }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
