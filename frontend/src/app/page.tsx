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
        <div className="flex items-center justify-center min-h-screen bg-black overflow-hidden font-sans text-slate-200 antialiased selection:bg-[#00ff80]/30 relative">
            {/* Background Image Layer */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: 'url("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=3840&auto=format&fit=crop")',
                }}
            />
            {/* Darker, focused overlay */}
            <div className="absolute inset-0 z-0 bg-black/60 backdrop-blur-[2px]" />

            <div className="relative z-10 flex flex-col items-center w-full max-w-4xl px-4">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="mb-10 text-center"
                >
                    <div className="inline-flex items-center justify-center p-4 mb-4 rounded-2xl bg-black/40 border border-[#00ff80]/20 shadow-[0_0_30px_rgba(0,255,128,0.1)] backdrop-blur-md">
                        <Shield className="w-8 h-8 text-[#00ff80]" />
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black mb-2 tracking-tighter italic uppercase text-white">
                        NexusFlow
                    </h1>
                    <p className="text-[#00ff80] text-xs font-bold uppercase tracking-[0.4em] opacity-80">
                        Enterprise Orchestration Nexus
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-full max-w-[400px] aspect-square bg-black/50 backdrop-blur-3xl border border-white/10 p-10 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col justify-center relative group"
                >
                    {/* Subtle Internal Glow */}
                    <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#00ff80]/20 to-transparent" />
                    <div className="absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-transparent via-[#00ff80]/20 to-transparent" />

                    <div className="mb-8 text-center">
                        <h2 className="text-2xl font-black text-white italic uppercase tracking-tight mb-1">Initialize Session</h2>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[8px]">Secure Protocol v4.1 - Access Restricted</p>
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
                            className="w-full bg-[#00ff80] hover:bg-[#00cc66] text-black font-black py-4 rounded-xl transition-all duration-300 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,128,0.3)] disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden uppercase tracking-[0.2em] text-[10px] mt-4"
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

                <div className="mt-12 text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] z-10 flex items-center">
                    <Shield className="w-3 h-3 mr-2 opacity-50" />
                    Secured by NexusFlow Post-Quantum Protocols
                </div>
            </div>
        </div>
    );
}
