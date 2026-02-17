"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, Loader2, Shield, Eye, EyeOff, AlertCircle } from "lucide-react";
import apiClient, { API_BASE_URL } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

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
            const formData = new URLSearchParams();
            formData.append("username", email);
            formData.append("password", password);

            const response = await apiClient.post("login/access-token", formData.toString(), {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            });

            localStorage.setItem("access_token", response.data.access_token);

            // Artificial delay for premium feel and state persistence
            setTimeout(() => {
                router.push("/dashboard");
            }, 500);
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || `Connection failed to ${API_BASE_URL.replace('/api/v1', '')}. Please verify your Backend service is active.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8 relative overflow-hidden font-sans text-slate-200 antialiased selection:bg-[#00ff80]/30">
            {/* Background Image - Monochrome Glacier */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat bg-fixed"
                style={{
                    backgroundImage: 'url("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=3840&auto=format&fit=crop")',
                }}
            />

            {/* Overlay & Blur */}
            <div className="absolute inset-0 z-0 bg-black/30 backdrop-blur-[8px]" />

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="mb-12 text-center z-10 relative"
            >
                <div className="inline-flex items-center justify-center p-5 mb-6 rounded-[2rem] bg-black/40 border border-[#00ff80]/30 shadow-[0_0_40px_rgba(0,255,128,0.2)] relative group backdrop-blur-md">
                    <Shield className="w-10 h-10 text-[#00ff80] group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-[#00ff80]/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h1 className="text-6xl md:text-7xl font-black mb-4 tracking-tighter italic uppercase text-white drop-shadow-2xl">
                    NexusFlow
                </h1>
                <p className="text-[#00ff80] text-sm md:text-base max-w-xl mx-auto font-bold uppercase tracking-[0.4em] opacity-90 text-shadow-glow">
                    Enterprise Orchestration Nexus
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="w-full max-w-lg bg-black/40 backdrop-blur-2xl border border-white/10 p-10 md:p-14 rounded-[3rem] shadow-[0_0_80px_rgba(0,0,0,0.8)] relative z-10"
            >
                {/* Neon Glow behind the card */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#00ff80]/5 blur-[100px] rounded-full -z-10 pointer-events-none" />
                <div className="mb-8 text-center">
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tight mb-2">Initialize Session</h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Secure Protocol v4.1 - Access Restricted</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-[#00ff80] uppercase tracking-[0.2em] ml-1 block">Identity Matrix</label>
                        <div className="relative group">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#00ff80] transition-colors z-20" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#00ff80]/50 focus:border-[#00ff80]/50 transition-all duration-300 text-sm font-medium"
                                placeholder="name@enterprise.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-[#00ff80] uppercase tracking-[0.2em] ml-1 block">Access Key</label>
                        <div className="relative group">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#00ff80] transition-colors z-20" />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-12 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#00ff80]/50 focus:border-[#00ff80]/50 transition-all duration-300 text-sm"
                                placeholder="••••••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="px-5 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold tracking-wide flex items-center"
                            >
                                <AlertCircle className="w-3 h-3 mr-2 shrink-0" />
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#00ff80] hover:bg-[#00cc66] text-black font-black py-4 rounded-xl transition-all duration-300 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,128,0.3)] disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden uppercase tracking-[0.2em] text-[10px] mt-4 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <>
                                <span>Establish Connection</span>
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>
            </motion.div>

            {/* Bottom Right Logout/Terminate */}
            <div className="fixed bottom-8 right-8 z-50">
                <button
                    onClick={() => {
                        localStorage.removeItem("access_token");
                        window.location.reload();
                    }}
                    className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-black/60 border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all duration-300 backdrop-blur-md group"
                >
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Terminate Session</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)] group-hover:animate-pulse" />
                </button>
            </div>

            <div className="fixed bottom-8 left-8 text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] z-10 flex items-center mix-blend-difference">
                <Shield className="w-3 h-3 mr-2 opacity-50" />
                Secured by NexusFlow
            </div>
        </div>
    );
}

