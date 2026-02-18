"use client";

import React from 'react';
import { LogOut, LayoutDashboard, GitBranch, Shield, Bell, Cpu, Lock, LucideIcon, ChevronRight, Activity, ChevronLeft } from "lucide-react";
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
    const [collapsed, setCollapsed] = React.useState(false);

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
                animate={{ width: collapsed ? 80 : 288, x: 0, opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="sidebar-glass flex flex-col shrink-0 relative z-50 h-screen overflow-hidden"
            >
                {/* Brand */}
                <div className={`p-6 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
                    <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => router.push('/dashboard')}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-primary to-accent-primary-hover flex items-center justify-center shadow-lg group-hover:shadow-glow transition-all duration-300 shrink-0">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        {!collapsed && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="flex flex-col overflow-hidden"
                            >
                                <h1 className="text-xl font-bold tracking-tight text-text-primary leading-none truncate">NexusFlow</h1>
                                <span className="text-[10px] font-medium text-accent-secondary tracking-widest uppercase mt-1 truncate">Enterprise</span>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 space-y-2 mt-2">
                    {filteredNavItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex items-center ${collapsed ? 'justify-center px-0' : 'px-4'} py-3 rounded-lg transition-all duration-200 group relative overflow-hidden ${isActive
                                    ? "bg-surface-active/80 text-white shadow-inner backdrop-blur-sm"
                                    : "text-text-secondary hover:text-white hover:bg-surface-hover/50"
                                    }`}
                                title={collapsed ? item.name : undefined}
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
                                <item.icon className={`w-5 h-5 transition-colors shrink-0 ${isActive ? "text-accent-primary" : "text-text-tertiary group-hover:text-text-primary"} ${collapsed ? '' : 'mr-3'}`} />
                                {!collapsed && (
                                    <span className="text-sm font-medium tracking-wide truncate">{item.name}</span>
                                )}

                                {/* Hover Effect */}
                                {isActive && (
                                    <div className="absolute inset-0 bg-accent-primary opacity-[0.03] pointer-events-none" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Collapse Toggle (Bottom) */}
                <div className="px-4 py-2 border-t border-border/50 flex justify-end">
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-1.5 rounded-lg hover:bg-surface-hover text-text-tertiary hover:text-white transition-colors"
                    >
                        <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
                    </button>
                </div>

                {/* User Profile */}
                <div className="p-4 mt-auto border-t border-border bg-black/20 relative z-50">
                    <button
                        onClick={() => setShowProfile(!showProfile)}
                        className={`w-full flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} cursor-pointer hover:bg-surface-hover/50 p-2 rounded-lg transition-all focus:outline-none focus:ring-1 focus:ring-indigo-500/20 text-left`}
                    >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-surface-elevated to-surface border border-border flex items-center justify-center shrink-0 text-xs font-bold text-text-secondary">
                            {user?.full_name?.substring(0, 2).toUpperCase() || "US"}
                        </div>
                        {!collapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{user?.full_name || "User"}</p>
                                <p className="text-[10px] text-text-tertiary uppercase tracking-wider truncate">{user?.roles?.[0]?.name || "Staff"}</p>
                            </div>
                        )}
                        {!collapsed && (
                            <ChevronRight className={`w-4 h-4 text-text-tertiary transition-transform duration-200 ${showProfile ? "rotate-90 text-indigo-400" : ""}`} />
                        )}
                    </button>

                    <AnimatePresence>
                        {showProfile && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className={`absolute bottom-full mb-2 glass-panel rounded-xl p-2 z-[100] ${collapsed ? 'left-2 right-2' : 'left-4 right-4'}`}
                            >
                                <button
                                    onClick={() => {
                                        localStorage.removeItem("access_token");
                                        window.location.href = "/";
                                    }}
                                    className="w-full flex items-center justify-center space-x-2 text-accent-error hover:text-red-400 transition-colors text-xs font-medium px-2 py-1.5 rounded hover:bg-surface-hover"
                                    title="Sign Out"
                                >
                                    <LogOut className="w-3 h-3" />
                                    {!collapsed && <span>Sign Out</span>}
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

                        <div className="flex items-center px-3 py-1.5 rounded-full glass-panel">
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
