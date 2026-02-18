"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, Loader2, Shield, Eye, EyeOff, AlertCircle, Cpu } from "lucide-react";
import apiClient, { API_BASE_URL } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

interface ApiError {
    response?: {
        status: number;
        data?: {
            detail?: string;
        };
    };
}

export default function LoginPage() {
    const [email, setEmail] = useState("manager@example.com");
    const [password, setPassword] = useState("manager123");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const backendBaseUrl = (API_BASE_URL && API_BASE_URL.startsWith('http'))
                ? API_BASE_URL
                : 'https://antigravity-backend-8ytp.onrender.com/api/v1';

            const loginUrl = `${backendBaseUrl}/login/access-token`;
            console.log(`[NexusFlow] Initializing Auth Protocol at: ${loginUrl}`);

            const formData = new URLSearchParams();
            formData.append("username", email);
            formData.append("password", password);

            const response = await apiClient.post(loginUrl, formData.toString(), {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            });

            localStorage.setItem("access_token", response.data.access_token);

            setTimeout(() => {
                router.push("/dashboard");
            }, 500);
        } catch (err) {
            const errorObj = err as ApiError;
            console.error("Login Error:", errorObj);
            if (errorObj.response?.status === 429) {
                setError("System Overload (Rate Limited). Please wait 60 seconds.");
            } else if (errorObj.response?.status === 401) {
                setError("Invalid Identity Matrix or Access Key.");
            } else {
                setError(errorObj.response?.data?.detail || "Connection Failed. Backward backend offline.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-black overflow-hidden font-sans text-slate-200 antialiased selection:bg-indigo-500/30 relative">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-indigo-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-blue-600/10 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center w-full max-w-4xl px-4">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="mb-10 text-center"
                >
                    <div className="inline-flex items-center justify-center p-4 mb-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.15)] backdrop-blur-md">
                        <Cpu className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tighter text-white">
                        NexusFlow
                    </h1>
                    <p className="text-indigo-400 text-xs font-bold uppercase tracking-[0.4em] opacity-80 flex items-center justify-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        Enterprise Orchestration
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-full max-w-[420px] glass-panel p-8 md:p-10 rounded-[2.5rem] shadow-2xl relative group overflow-hidden"
                >
                    {/* Glass Shine Effect */}
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                    <div className="mb-8 relative z-10">
                        <h2 className="text-2xl font-bold text-white mb-1">Initialize Session</h2>
                        <p className="text-slate-500 text-xs text-medium">Secure Access Portal v4.1</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5 relative z-10">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 block">Identity</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors z-20" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300 text-sm font-medium"
                                    placeholder="name@enterprise.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 block">Credential</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors z-20" />
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-11 pr-12 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300 text-sm"
                                    placeholder="••••••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold tracking-wide flex items-center">
                                        <AlertCircle className="w-3 h-3 mr-2 shrink-0" />
                                        {error}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-4 rounded-xl transition-all duration-300 flex items-center justify-center shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden text-xs uppercase tracking-wider mt-2"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <>
                                    <span>Authenticate</span>
                                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>

                <div className="mt-12 text-slate-600 text-[10px] font-bold uppercase tracking-widest z-10 flex items-center gap-2 opacity-60">
                    <Shield className="w-3 h-3" />
                    Secured by NexusFlow Architect
                </div>
            </div>
        </div>
    );
}
