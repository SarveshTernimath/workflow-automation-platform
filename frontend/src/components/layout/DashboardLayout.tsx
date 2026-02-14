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
                const res = await apiClient.get("/users/me");
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
    if (isAdmin) {
        navItems.push({ name: "Admin Console", icon: Lock, path: "/admin" });
    }

    return (
        <div className="flex min-h-screen bg-background text-slate-200 font-sans selection:bg-primary/30 antialiased overflow-hidden">
            {/* Sidebar with Glassmorphism */}
            <aside className="w-72 glass-dark flex flex-col shrink-0 relative z-20 border-r border-white/5">
                <div className="p-8 pb-10">
                    <div className="flex items-center space-x-3 group cursor-pointer overflow-hidden">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center glow-indigo group-hover:scale-110 transition-all duration-500 shadow-lg shadow-indigo-500/20 shrink-0">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-2xl font-black gradient-text tracking-tighter uppercase italic truncate">NexusFlow</h2>
                    </div>
                </div>

                <nav className="flex-1 px-6 space-y-1.5 mt-4">
                    <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 opacity-50">Control Node</p>
                    {navItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex items-center px-4 py-3.5 rounded-2xl transition-all duration-300 group relative border ${isActive
                                    ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 glow-indigo"
                                    : "border-transparent text-slate-400 hover:bg-white/5 hover:text-white"
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 mr-3 shrink-0 transition-all duration-300 ${isActive ? "text-indigo-400 scale-110" : "text-slate-500 group-hover:text-white"}`} />
                                <span className={`font-bold tracking-tight transition-all duration-300 ${isActive ? "translate-x-1" : ""}`}>{item.name}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-active"
                                        className="ml-auto w-1 h-5 rounded-full bg-indigo-500 glow-indigo shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-6 mt-auto">
                    <div
                        onClick={() => setShowProfile(true)}
                        className="flex items-center p-4 rounded-2xl glass border-white/5 mb-6 overflow-hidden hover:bg-white/10 transition-all cursor-pointer group shadow-xl"
                    >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-500 flex items-center justify-center text-white font-black mr-3 shrink-0 shadow-lg group-hover:rotate-12 transition-all duration-500">
                            {user?.full_name?.substring(0, 2).toUpperCase() || "SY"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-white truncate tracking-tight uppercase">
                                {user?.full_name || "Identity Node"}
                            </p>
                            <p className="text-[10px] font-bold text-slate-500 truncate uppercase tracking-widest opacity-70">
                                {user?.roles?.[0]?.name || "Strategic"} Access
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all duration-300 cursor-pointer group border border-transparent hover:border-red-500/20"
                    >
                        <LogOut className="w-5 h-5 mr-3 shrink-0 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold tracking-tight">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-transparent relative h-screen overflow-hidden">
                <header className="min-h-24 border-b border-white/5 glass backdrop-blur-3xl z-30 shrink-0 flex items-center">
                    <div className="w-full max-w-7xl mx-auto px-6 md:px-10 lg:px-16 flex flex-wrap items-center justify-between gap-6">
                        <div className="flex flex-col">
                            <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-black uppercase tracking-widest opacity-50 mb-1">
                                <Cpu className="w-3 h-3" />
                                <span>Core Path: {pathname.split('/')[1] || "root"}</span>
                            </div>
                            <span className="text-2xl font-black text-white tracking-tighter uppercase italic">
                                {navItems.find(i => i.path === pathname)?.name || "Console"}
                            </span>
                        </div>

                        <div className="flex items-center space-x-3 sm:space-x-5">
                            <div className="hidden xl:flex items-center space-x-6 mr-4 border-r border-white/10 pr-6">
                                <div className="flex flex-col items-end whitespace-nowrap">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Network Latency</span>
                                    <span className="text-xs font-bold text-emerald-400">12ms</span>
                                </div>
                                <div className="flex flex-col items-end whitespace-nowrap">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">System Uptime</span>
                                    <span className="text-xs font-bold text-white">99.9%</span>
                                </div>
                            </div>

                            <div className="flex items-center px-3 sm:px-4 py-2 rounded-xl glass border-emerald-500/20 shrink-0">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse shadow-[0_0_10px_#10b981]" />
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] hidden xs:inline">Operational</span>
                            </div>

                            <button
                                onClick={() => router.push('/notifications')}
                                className="p-2 sm:p-3 rounded-xl glass border-white/10 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-all relative group shadow-lg shrink-0"
                            >
                                <Bell className="w-4 h-4 sm:w-5 sm:h-5 group-hover:shake" />
                                <span className="absolute top-2 sm:top-3 right-2 sm:right-3 w-1.5 h-1.5 bg-indigo-500 rounded-full glow-indigo shadow-[0_0_8px_rgba(99,102,241,1)]"></span>
                            </button>

                            <div className="hidden lg:flex items-center px-4 py-2 rounded-xl bg-slate-900 border border-white/10 shrink-0">
                                <Shield className="w-3 h-3 text-indigo-400 mr-2" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{user?.roles?.[0]?.name || "Strategic"} Role</span>
                            </div>

                            <button
                                onClick={() => setShowProfile(true)}
                                className="flex items-center space-x-2 px-3 sm:px-5 py-2.5 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-all duration-300 font-black text-xs shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 shrink-0"
                            >
                                <User className="w-4 h-4" />
                                <span className="uppercase tracking-widest hidden sm:inline">User Identity</span>
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto scrollbar-hide relative bg-transparent">
                    <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 py-8 md:py-12 lg:py-16">
                        {/* Background Accents */}
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />

                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        >
                            {children}
                        </motion.div>
                    </div>
                </main>
            </div>

            {/* Profile Modal */}
            <AnimatePresence>
                {showProfile && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowProfile(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-lg glass-dark border border-white/10 rounded-[3rem] p-12 relative overflow-hidden shadow-2xl"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full -z-10" />
                            <div className="flex flex-col items-center text-center">
                                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-500 to-sky-500 flex items-center justify-center text-white text-4xl font-black mb-8 shadow-2xl transform rotate-3">
                                    {user?.full_name?.substring(0, 2).toUpperCase() || "SY"}
                                </div>
                                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2">{user?.full_name || "Identity Node"}</h2>
                                <p className="text-indigo-400 font-black uppercase tracking-[0.3em] text-[10px] mb-8">{user?.roles?.[0]?.name || "Strategic"} Authorization Level</p>

                                <div className="w-full space-y-4 mb-8">
                                    <div className="bg-white/5 border border-white/5 p-6 rounded-2xl flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email Node</span>
                                        <span className="text-sm font-bold text-white">{user?.email}</span>
                                    </div>
                                    <div className="bg-white/5 border border-white/5 p-6 rounded-2xl flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol Version</span>
                                        <span className="text-sm font-bold text-emerald-400">V4.2.0-STABLE</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowProfile(false)}
                                    className="w-full bg-white/5 hover:bg-white/10 text-white font-black py-5 rounded-2xl transition-all uppercase tracking-widest text-[10px] border border-white/10"
                                >
                                    Dismiss Terminal
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
