"use client";

import React from 'react';
import { LogOut, LayoutDashboard, GitBranch, Shield, Bell, User, Cpu, Lock, LucideIcon } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from '@/lib/api';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = React.useState<any>(null);
    const [showProfile, setShowProfile] = React.useState(false);

    React.useEffect(() => {
        async function fetchUser() {
            try {
                const res = await apiClient.get("users/me");
                setUser(res.data);
            } catch (err) {
                console.error("Layout auth check failed", err);
            }
        }
        fetchUser();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        router.push("/");
    };

    interface NavItem {
        name: string;
        icon: LucideIcon;
        path: string;
    }

    const navItems: NavItem[] = [
        { name: "Overview", icon: LayoutDashboard, path: "/dashboard" },
        { name: "My Tasks", icon: GitBranch, path: "/tasks" },
        { name: "Ledger", icon: Cpu, path: "/requests" },
        { name: "Inventory", icon: Shield, path: "/workflows" },
        { name: "Alerts", icon: Bell, path: "/notifications" },
    ];

    const isAdmin = user?.roles?.some((r: any) => r.name.toLowerCase() === "admin");

    if (isAdmin && !navItems.some(i => i.path === "/admin")) {
        navItems.push({ name: "Admin Console", icon: Lock, path: "/admin" });
    }

    return (
        <div className="flex flex-col min-h-screen bg-transparent text-slate-200 font-sans selection:bg-white/30 antialiased overflow-hidden">

            {/* LEVEL 1: Command Center Top Nav - "The Bridge" */}
            <nav className="h-20 shrink-0 z-50 glass-dark border-b border-white/20 flex items-center justify-between px-8 mx-6 mt-6 relative rounded-2xl">

                {/* Brand */}
                <div className="flex items-center space-x-4 cursor-pointer" onClick={() => router.push('/dashboard')}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white to-slate-400 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                        <Shield className="w-5 h-5 text-black fill-current" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-black gradient-text tracking-tighter uppercase italic leading-none">NexusFlow</h1>
                        <span className="text-[9px] font-bold text-slate-400 tracking-[0.3em] uppercase opacity-70">Enterprise Nexus</span>
                    </div>
                </div>

                {/* Navigation Pills */}
                <div className="hidden md:flex items-center p-1.5 bg-black/40 rounded-xl border border-white/10 backdrop-blur-md">
                    {navItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex items-center px-5 py-2.5 rounded-lg transition-all duration-300 group relative ${isActive
                                        ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] font-bold"
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                <item.icon className={`w-4 h-4 mr-2 ${isActive ? "text-black" : "text-slate-500 group-hover:text-white"}`} />
                                <span className="text-sm tracking-tight">{item.name}</span>
                            </Link>
                        );
                    })}
                </div>

                {/* Right Controls */}
                <div className="flex items-center space-x-4">
                    <div className="flex items-center px-4 py-2 rounded-lg bg-black/40 border border-white/10 hover:border-white/30 transition-all group cursor-pointer" onClick={() => router.push('/notifications')}>
                        <Bell className="w-4 h-4 text-slate-300 group-hover:text-white transition-colors" />
                        <span className="ml-3 text-[10px] font-black text-emerald-400 tracking-widest uppercase animate-pulse">Live</span>
                    </div>

                    <div
                        onClick={() => setShowProfile(true)}
                        className="flex items-center space-x-3 pl-4 border-l border-white/10 cursor-pointer group"
                    >
                        <div className="text-right hidden lg:block">
                            <p className="text-sm font-bold text-white leading-none group-hover:text-indigo-300 transition-colors">{user?.full_name || "Identity Node"}</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">{user?.roles?.[0]?.name || "Strategic"} Access</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform ring-2 ring-transparent group-hover:ring-white/20">
                            {user?.full_name?.substring(0, 2).toUpperCase() || "SY"}
                        </div>
                    </div>
                </div>
            </nav>

            {/* LEVEL 2: Context Bar - Breadcrumbs & Local Stats */}
            <header className="h-16 shrink-0 z-40 flex items-center justify-between px-10 mx-6 mt-2">
                <div className="flex items-center space-x-4">
                    <span className="text-slate-500/50 font-bold uppercase tracking-widest text-[10px]">{pathname.split('/')[1] || "Root"} /</span>
                    <span className="text-2xl font-black text-white uppercase italic tracking-tighter">
                        {navItems.find(i => i.path === pathname)?.name || "Console"}
                    </span>
                </div>

                <div className="flex items-center space-x-8">
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Latency</span>
                        <span className="text-xs font-bold text-emerald-400 font-mono">14ms</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Uptime</span>
                        <span className="text-xs font-bold text-white font-mono">99.99%</span>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto scrollbar-hide relative px-6 pb-6">
                <div className="w-full h-full rounded-[2rem] glass overflow-hidden relative shadow-2xl ring-1 ring-white/10">
                    {/* Inner Content Scroller */}
                    <div className="w-full h-full overflow-y-auto p-8 md:p-12 relative scrollbar-hide">
                        {/* Ambient Glows */}
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />

                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, ease: "circOut" }}
                            className="relative z-10"
                        >
                            {children}
                        </motion.div>
                    </div>
                </div>
            </main>

            {/* Profile Modal */}
            <AnimatePresence>
                {showProfile && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowProfile(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="w-full max-w-md glass-dark border border-white/20 rounded-[2.5rem] p-10 relative overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)]"
                        >
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 blur-[60px] rounded-full -z-10" />

                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-2xl bg-white text-black flex items-center justify-center text-2xl font-black mb-6 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                                    {user?.full_name?.substring(0, 2).toUpperCase() || "SY"}
                                </div>
                                <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-1">{user?.full_name || "Identity Node"}</h2>
                                <p className="text-emerald-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-8">{user?.roles?.[0]?.name || "Strategic"} Access</p>

                                <div className="w-full space-y-3 mb-8 text-left">
                                    <div className="bg-black/40 border border-white/10 p-5 rounded-xl flex items-center justify-between group hover:border-white/20 transition-all">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-white transition-colors">Email</span>
                                        <span className="text-xs font-bold text-slate-300">{user?.email}</span>
                                    </div>
                                    <div className="bg-black/40 border border-white/10 p-5 rounded-xl flex items-center justify-between group hover:border-white/20 transition-all">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-white transition-colors">Security</span>
                                        <span className="text-xs font-bold text-emerald-400">Encrypted</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleLogout}
                                    className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-black py-4 rounded-xl transition-all uppercase tracking-widest text-[10px] border border-red-500/20 flex items-center justify-center space-x-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Terminate Session</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
