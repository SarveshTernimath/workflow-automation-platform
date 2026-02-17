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

    // RBAC: Filter Navigation Items
    const userRoles = user?.roles?.map((r: any) => r.name.toLowerCase()) || [];
    const isAdmin = userRoles.includes("admin");
    const isManager = userRoles.includes("manager");

    const filteredNavItems = navItems.filter(item => {
        if (isAdmin) return true; // Admin sees everything

        if (isManager) {
            // Manager sees Dashboard, Tasks, Alerts
            return ["/dashboard", "/tasks", "/notifications"].includes(item.path);
        }

        // Standard User sees Dashboard, Alerts (Requests initiated from Dashboard)
        return ["/dashboard", "/notifications"].includes(item.path);
    });

    if (isAdmin && !filteredNavItems.some(i => i.path === "/admin")) {
        filteredNavItems.push({ name: "Admin Console", icon: Lock, path: "/admin" });
    }

    return (
        <div className="flex min-h-screen bg-transparent text-slate-200 font-sans selection:bg-[#00ff80]/30 antialiased overflow-hidden">

            {/* LEVEL 1: Left Sidebar "Control Node" - Restored & Neon Enhanced */}
            <aside className="w-72 sidebar-glass flex flex-col shrink-0 relative z-50">

                {/* Brand */}
                <div className="p-8 pb-10">
                    <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push('/dashboard')}>
                        <div className="w-10 h-10 rounded-xl bg-black border border-[#00ff80]/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,128,0.2)]">
                            <Shield className="w-5 h-5 text-[#00ff80]" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-black gradient-text tracking-tighter uppercase italic leading-none">NexusFlow</h1>
                            <span className="text-[9px] font-bold text-[#00ff80] tracking-[0.3em] uppercase opacity-80 pl-0.5">Control Node</span>
                        </div>
                    </div>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 px-4 space-y-2 mt-2">
                    {filteredNavItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex items-center px-6 py-4 rounded-xl transition-all duration-300 group relative ${isActive
                                    ? "nav-item-active font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] bg-gradient-to-r from-[#00ff80]/10 to-transparent" // Added embossing/gradient
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 mr-4 transition-all duration-300 ${isActive ? "text-[#00ff80]" : "text-slate-600 group-hover:text-white"}`} />
                                <span className="text-sm tracking-wide uppercase">{item.name}</span>
                                {isActive && (
                                    <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-[#00ff80] shadow-[0_0_10px_#00ff80]" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Profile Section */}
                <div className="p-6 mt-auto border-t border-white/5 bg-black/40 relative">
                    <div
                        onClick={() => setShowProfile(!showProfile)}
                        className="flex items-center space-x-4 cursor-pointer group hover:bg-white/5 p-3 rounded-xl transition-all"
                    >
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00ff80] to-emerald-900 flex items-center justify-center text-black font-black shadow-lg">
                            {user?.full_name?.substring(0, 2).toUpperCase() || "SY"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white leading-none group-hover:text-[#00ff80] transition-colors">{user?.full_name || "Identity Node"}</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1.5">{user?.roles?.[0]?.name || "Strategic"} Access</p>
                        </div>
                    </div>

                    {/* Profile Popover - Bottom Left */}
                    <AnimatePresence>
                        {showProfile && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute bottom-full left-4 mb-4 w-64 bg-black/90 backdrop-blur-xl border border-[#00ff80]/30 rounded-2xl p-6 shadow-2xl z-[60]"
                            >
                                <div className="flex flex-col space-y-4">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <div className="w-8 h-8 rounded-full bg-[#00ff80] flex items-center justify-center text-black font-bold text-xs">
                                            {user?.full_name?.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-white text-xs font-bold">{user?.full_name}</p>
                                            <p className="text-[9px] text-[#00ff80] uppercase tracking-wider">{user?.roles?.[0]?.name}</p>
                                        </div>
                                    </div>

                                    <div className="h-px bg-white/10" />

                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors text-xs font-bold uppercase tracking-wider"
                                    >
                                        <LogOut className="w-3 h-3" />
                                        <span>Terminate Session</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </aside>

            {/* LEVEL 2: Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 relative h-screen overflow-hidden">

                {/* Header Bar - Floating & Minimal */}
                <header className="h-24 shrink-0 z-40 flex items-center justify-between px-10 pt-6">
                    <div className="flex flex-col">
                        <div className="flex items-center space-x-2 text-[10px] text-[#00ff80] font-black uppercase tracking-widest mb-1 opacity-70">
                            <Cpu className="w-3 h-3" />
                            <span>System Path: {pathname}</span>
                        </div>
                        <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter text-shadow-lg">
                            {navItems.find(i => i.path === pathname)?.name || "Dashboard"}
                        </h2>
                    </div>

                    <div className="flex items-center space-x-6">
                        <div className="flex items-center px-4 py-2 rounded-lg bg-black/60 border border-[#00ff80]/20 backdrop-blur-md">
                            <div className="w-2 h-2 rounded-full bg-[#00ff80] mr-3 animate-pulse shadow-[0_0_10px_#00ff80]" />
                            <span className="text-[10px] font-black text-[#00ff80] uppercase tracking-widest">System Online</span>
                        </div>

                        <button onClick={() => router.push('/notifications')} className="relative p-3 rounded-lg bg-black/40 hover:bg-[#00ff80]/10 border border-white/10 hover:border-[#00ff80]/30 transition-all group">
                            <Bell className="w-5 h-5 text-slate-400 group-hover:text-[#00ff80]" />
                            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#00ff80] rounded-full shadow-[0_0_5px_#00ff80]"></span>
                        </button>
                    </div>
                </header>

                {/* Content Viewport */}
                <div className="flex-1 overflow-y-auto scrollbar-hide relative px-10 pb-10 pt-4">
                    {/* Glass Container for Content */}
                    <div className="w-full min-h-full">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, ease: "circOut" }}
                            className="relative z-10"
                        >
                            {children}
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
}
