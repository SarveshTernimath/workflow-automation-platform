"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, Loader2, Shield, Eye, EyeOff, AlertCircle } from "lucide-react";
import apiClient from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
    const [email, setEmail] = useState("admin@example.com");
    const [password, setPassword] = useState("adminpassword123");
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

            const response = await apiClient.post("/login/access-token", formData.toString(), {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            });

            localStorage.setItem("access_token", response.data.access_token);

            // Artificial delay for premium feel and state persistence
            setTimeout(() => {
                router.push("/dashboard");
            }, 500);
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || "Authentication failed. Access denied by Security Protocol.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8 bg-[#020617] selection:bg-indigo-500/30 overflow-hidden relative">
            {/* Ambient Background Lights */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="mb-16 text-center z-10"
            >
                <div className="inline-flex items-center justify-center p-5 mb-8 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl shadow-indigo-500/20 relative group">
                    <Shield className="w-10 h-10 text-white group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-white/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter italic uppercase gradient-text">
                    Antigravity
                </h1>
                <p className="text-slate-500 text-lg md:text-xl max-w-xl mx-auto font-medium uppercase tracking-[0.4em] opacity-80">
                    Enterprise Orchestration Nexus
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="w-full max-w-lg glass-dark border border-white/5 p-12 md:p-16 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-10"
            >
                <div className="mb-10">
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tight mb-2">Initialize Session</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Secure Protocol v4.1 - Access Restricted</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-8">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Identity Matrix</label>
                        <div className="relative group">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-900 border border-white/5 rounded-2xl py-5 pl-14 pr-5 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/20 transition-all duration-500 text-lg font-medium"
                                placeholder="name@enterprise.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Access Key</label>
                        <div className="relative group">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-900 border border-white/5 rounded-2xl py-5 pl-14 pr-14 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/20 transition-all duration-500 text-lg"
                                placeholder="••••••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="px-6 py-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm font-bold tracking-tight flex items-center"
                            >
                                <AlertCircle className="w-4 h-4 mr-3 shrink-0" />
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-black py-5 rounded-2xl transition-all duration-500 flex items-center justify-center shadow-2xl shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden uppercase tracking-[0.3em] text-xs mt-10"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        <div className="relative flex items-center">
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin mr-3" />
                            ) : (
                                <>
                                    <span>Establish Connection</span>
                                    <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-2 transition-transform duration-500" />
                                </>
                            )}
                        </div>
                    </button>
                </form>
            </motion.div>

            <div className="mt-16 text-slate-700 text-[10px] font-black uppercase tracking-[0.5em] z-10 flex items-center">
                <Shield className="w-3 h-3 mr-3 text-indigo-500/30" />
                Secured by Antigravity Post-Quantum Protocols
            </div>
        </div>
    );
}

