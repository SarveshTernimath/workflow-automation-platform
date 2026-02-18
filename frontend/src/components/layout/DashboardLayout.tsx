"use client";

import React from 'react';
import { LogOut, LayoutDashboard, GitBranch, Shield, Bell, Cpu, Lock, LucideIcon, ChevronRight, Activity } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from '@/lib/api';


interface DashboardLayoutProps {
    children: React.ReactNode;
}

interface UserRole {
    id: string;
    name: string;
}

interface UserData {
    full_name?: string;
    roles?: UserRole[];
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = React.useState<UserData | null>(null);
    const [showProfile, setShowProfile] = React.useState(false);

    React.useEffect(() => {
        async function fetchUser() {
            try {
                const token = localStorage.getItem("access_token");
                if (!token) {
                    router.push("/");
                    return;
                }
                const res = await apiClient.get("users/me");
                setUser(res.data);
            } catch (err) {
                const error = err as { response?: { status?: number } };
                if (error.response?.status === 401 || error.response?.status === 403) {
                    router.push("/");
                }
            }
        }
        fetchUser();
    }, [router]);

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
        { name: "Visualizer", icon: Activity, path: "/visualizer" },
        { name: "Ledger", icon: Cpu, path: "/requests" },
        { name: "Inventory", icon: Shield, path: "/workflows" },
        { name: "Alerts", icon: Bell, path: "/notifications" },
    ];

    // RBAC: Filter Navigation Items
    const userRoles = user?.roles?.map((r) => r.name.toLowerCase()) || [];
    const isAdmin = userRoles.includes("admin");
    const isManager = userRoles.includes("manager") || userRoles.includes("strategic_node");

    const filteredNavItems = navItems.filter(item => {
        if (isAdmin) return true;
        if (isManager) return ["/dashboard", "/tasks", "/notifications"].includes(item.path);
        return ["/dashboard", "/notifications"].includes(item.path);
    });

    if (isAdmin && !filteredNavItems.some(i => i.path === "/admin")) {
        filteredNavItems.push({ name: "Admin Console", icon: Lock, path: "/admin" });
    }

    return (
        <div className="flex min-h-screen bg-background text-text-primary font-sans antialiased overflow-hidden relative">

            {/* Sidebar */}
            <motion.aside
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: "circOut" }}
                className="w-72 sidebar-glass flex flex-col shrink-0 relative z-50 h-screen"
            >
                {/* Brand */}
                <div className="p-8 pb-8">
                    <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => router.push('/dashboard')}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-primary to-accent-primary-hover flex items-center justify-center shadow-lg group-hover:shadow-glow transition-all duration-300">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold tracking-tight text-white leading-none">NexusFlow</h1>
                            <span className="text-[10px] font-medium text-accent-secondary tracking-widest uppercase mt-1">Enterprise</span>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 space-y-1 mt-2">
                    {filteredNavItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group relative overflow-hidden ${isActive
                                    ? "bg-surface-active/80 text-white shadow-inner backdrop-blur-sm"
                                    : "text-text-secondary hover:text-white hover:bg-surface-hover/50"
                                    }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeNav"
                                        className="absolute left-0 top-0 bottom-0 w-1 bg-accent-primary"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                    />
                                )}
                                <item.icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? "text-accent-primary" : "text-text-tertiary group-hover:text-text-primary"}`} />
                                <span className="text-sm font-medium tracking-wide">{item.name}</span>

                                {/* Hover Effect */}
                                {isActive && (
                                    <div className="absolute inset-0 bg-accent-primary opacity-[0.03] pointer-events-none" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile */}
                <div className="p-4 mt-auto border-t border-border bg-surface/30 backdrop-blur-md">
                    <div
                        onClick={() => setShowProfile(!showProfile)}
                        className="flex items-center space-x-3 cursor-pointer hover:bg-surface-hover/50 p-2 rounded-lg transition-all"
                    >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-surface-elevated to-surface border border-border flex items-center justify-center text-xs font-bold text-text-secondary">
                            {user?.full_name?.substring(0, 2).toUpperCase() || "US"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.full_name || "User"}</p>
                            <p className="text-[10px] text-text-tertiary uppercase tracking-wider">{user?.roles?.[0]?.name || "Staff"}</p>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-text-tertiary transition-transform ${showProfile ? "rotate-90" : ""}`} />
                    </div>

                    <AnimatePresence>
                        {showProfile && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute bottom-full left-4 right-4 mb-2 glass-panel rounded-xl p-4 z-[60]"
                            >
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center space-x-2 text-accent-error hover:text-red-400 transition-colors text-xs font-medium px-2 py-1.5 rounded hover:bg-surface-hover"
                                >
                                    <LogOut className="w-3 h-3" />
                                    <span>Sign Out</span>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 relative h-screen overflow-hidden bg-transparent z-10">
                {/* Header */}
                <header className="h-20 shrink-0 z-40 flex items-center justify-between px-8 pt-4">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="flex items-center space-x-2 text-[10px] text-text-tertiary font-medium uppercase tracking-widest mb-1">
                            <span>System</span>
                            <span className="text-border">/</span>
                            <span className="text-accent-primary">{pathname.replace('/', '')}</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white tracking-tight text-glow">
                            {navItems.find(i => i.path === pathname)?.name || "Dashboard"}
                        </h2>
                    </motion.div>

                    <div className="flex items-center space-x-4">
                        {/* Portal Target for Page Actions */}
                        <div id="header-actions" className="flex items-center space-x-2" />

                        <div className="flex items-center px-3 py-1.5 rounded-full bg-surface/50 border border-border backdrop-blur-md">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent-success mr-2 animate-pulse" />
                            <span className="text-[10px] font-medium text-text-secondary uppercase tracking-wider">Online</span>
                        </div>

                        <button onClick={() => router.push('/notifications')} className="relative p-2.5 rounded-full hover:bg-surface-hover/50 transition-colors text-text-secondary hover:text-white">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-accent-primary rounded-full ring-2 ring-background"></span>
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto scrollbar-hide p-8 pt-4">
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="w-full max-w-7xl mx-auto"
                    >
                        {children}
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
