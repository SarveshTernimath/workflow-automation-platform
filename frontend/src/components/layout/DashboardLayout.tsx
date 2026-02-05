"use client";

import React from 'react';
import { LogOut, LayoutDashboard, GitBranch, Shield, Bell, User, Cpu } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        router.push("/");
    };

    const navItems = [
        { name: "Overview", icon: LayoutDashboard, path: "/dashboard" },
        { name: "My Tasks", icon: GitBranch, path: "/tasks" },
        { name: "Ledger", icon: Cpu, path: "/requests" },
        { name: "Inventory", icon: Shield, path: "/workflows" },
        { name: "Alerts", icon: Bell, path: "/notifications" },
    ];

    return (
        <div className="flex min-h-screen bg-background text-slate-200 font-sans selection:bg-primary/30 antialiased overflow-hidden">
            {/* Sidebar with Glassmorphism */}
            <aside className="w-72 glass-dark flex flex-col shrink-0 relative z-20 border-r border-white/5">
                <div className="p-8 pb-10">
                    <div className="flex items-center space-x-3 group cursor-pointer">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center glow-indigo group-hover:scale-110 transition-all duration-500 shadow-lg shadow-indigo-500/20">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-2xl font-black gradient-text tracking-tighter uppercase italic">Antigravity</h2>
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
                    <div className="flex items-center p-4 rounded-2xl glass border-white/5 mb-6 overflow-hidden hover:bg-white/10 transition-all cursor-pointer group shadow-xl">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-500 flex items-center justify-center text-white font-black mr-3 shrink-0 shadow-lg group-hover:rotate-12 transition-all duration-500">
                            AD
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-white truncate tracking-tight">System Admin</p>
                            <p className="text-[10px] font-bold text-slate-500 truncate uppercase tracking-widest opacity-70">Privileged Access</p>
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
                <header className="h-24 border-b border-white/5 flex items-center justify-between px-10 glass backdrop-blur-3xl z-30">
                    <div className="flex flex-col">
                        <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-black uppercase tracking-widest opacity-50 mb-1">
                            <Cpu className="w-3 h-3" />
                            <span>System Path: {pathname.split('/')[1] || "root"}</span>
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                            {navItems.find(i => i.path === pathname)?.name || "Console"}
                        </h1>
                    </div>

                    <div className="flex items-center space-x-5">
                        <div className="hidden lg:flex items-center space-x-6 mr-4 border-r border-white/10 pr-6">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Latency</span>
                                <span className="text-xs font-bold text-emerald-400">12ms</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Uptime</span>
                                <span className="text-xs font-bold text-white">99.98%</span>
                            </div>
                        </div>

                        <div className="hidden md:flex items-center px-4 py-2 rounded-xl glass border-emerald-500/20">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse shadow-[0_0_10px_#10b981]" />
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Operational</span>
                        </div>

                        <button className="p-3 rounded-xl glass border-white/10 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-all relative group shadow-lg">
                            <Bell className="w-5 h-5 group-hover:shake" />
                            <span className="absolute top-3 right-3 w-1.5 h-1.5 bg-indigo-500 rounded-full glow-indigo shadow-[0_0_8px_rgba(99,102,241,1)]"></span>
                        </button>

                        <button className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-all duration-300 font-black text-xs shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95">
                            <User className="w-4 h-4" />
                            <span className="uppercase tracking-widest">Profile</span>
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-12 lg:p-16 scrollbar-hide relative bg-transparent">
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
                </main>
            </div>
        </div>
    );
}



