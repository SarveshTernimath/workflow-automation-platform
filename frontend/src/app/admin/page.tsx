"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Users, GitBranch, AlertTriangle, Play, Plus, Activity, ArrowRight, ShieldCheck, Database, Server, Settings } from "lucide-react";
import apiClient from "@/lib/api";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface Stats {
    users: number;
    workflows: number;
    requests: number;
    sla_breaches: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const router = useRouter();

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await apiClient.get("admin/");
                setStats(res.data);
            } catch (err) {
                console.error("Failed to fetch admin stats", err);
            }
        }
        fetchStats();
    }, []);

    const metrics = [
        { label: "Active Identities", value: stats?.users || 0, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
        { label: "Execution Protocols", value: stats?.workflows || 0, icon: GitBranch, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
        { label: "Live Instances", value: stats?.requests || 0, icon: Activity, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
        { label: "SLA Divergences", value: stats?.sla_breaches || 0, icon: AlertTriangle, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-8 max-w-[1600px] mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                            </div>
                            <h1 className="text-2xl font-bold text-text-primary">Admin Console</h1>
                        </div>
                        <p className="text-text-secondary text-sm max-w-2xl">
                            System-wide orchestration metrics and protocol definition terminal.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Link href="/admin/workflows/create">
                            <Button className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
                                <Plus className="w-4 h-4 mr-2" />
                                Define New Protocol
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {metrics.map((m, i) => (
                        <motion.div
                            key={m.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <Card className="glass-panel hover:border-indigo-500/30 transition-all duration-300 group h-full">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className={`p-3 rounded-xl ${m.bg} ${m.border} border text-white shadow-lg shadow-black/5`}>
                                            <m.icon className={`w-6 h-6 ${m.color}`} />
                                        </div>
                                        <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Live Telemetry</span>
                                    </div>
                                    <div>
                                        <h3 className="text-4xl font-bold text-white mb-2 tracking-tight group-hover:scale-105 transition-transform origin-left">
                                            {m.value}
                                        </h3>
                                        <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">{m.label}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Quick Actions & Control Panels */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-2 glass-panel">
                        <CardHeader className="p-6 border-b border-border flex flex-row items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <Server className="w-5 h-5 text-emerald-500" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold text-text-primary">System Governance</CardTitle>
                                    <p className="text-xs text-text-secondary uppercase tracking-wider mt-0.5">Node Authority & Access Controls</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => alert("Global System Settings module is restricted to Super Admin.")}
                                className="text-text-tertiary hover:text-white"
                            >
                                <Settings className="w-5 h-5" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div
                                    onClick={() => router.push('/admin/workflows')}
                                    className="group p-5 rounded-2xl bg-surface hover:bg-surface-active border border-border hover:border-indigo-500/30 transition-all cursor-pointer"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                                            <Database className="w-6 h-6" />
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-text-tertiary group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                                    </div>
                                    <h5 className="text-base font-bold text-text-primary mb-1">Schema Management</h5>
                                    <p className="text-xs text-text-secondary leading-relaxed">Update and refine core workflow data structures.</p>
                                </div>

                                <div
                                    onClick={() => router.push('/requests')}
                                    className="group p-5 rounded-2xl bg-surface hover:bg-surface-active border border-border hover:border-purple-500/30 transition-all cursor-pointer"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                                            <Activity className="w-6 h-6" />
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-text-tertiary group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                                    </div>
                                    <h5 className="text-base font-bold text-text-primary mb-1">System Audit</h5>
                                    <p className="text-xs text-text-secondary leading-relaxed">Review historical execution logs and diverging tasks.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-panel overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />
                        <CardContent className="p-8 flex flex-col h-full relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center text-white mb-6 shadow-xl shadow-indigo-500/20">
                                <Play className="w-7 h-7 fill-white ml-1" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">Initialization Sequence</h3>
                            <p className="text-text-secondary text-sm leading-relaxed mb-8">
                                Admins can override standard protocol constraints. Define custom execution pathways for emergency infrastructure adjustments.
                            </p>
                            <Button
                                onClick={() => router.push('/admin/workflows/create')}
                                className="mt-auto w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold uppercase tracking-wider"
                            >
                                Access Constructor
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
