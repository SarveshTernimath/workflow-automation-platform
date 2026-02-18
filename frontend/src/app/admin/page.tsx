"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Users, GitBranch, AlertTriangle, Play, Plus, Activity, ArrowRight, ShieldCheck, Database } from "lucide-react";
import apiClient from "@/lib/api";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

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
        { label: "Active Identities", value: stats?.users || 0, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
        { label: "Execution Protocols", value: stats?.workflows || 0, icon: GitBranch, color: "text-indigo-400", bg: "bg-indigo-500/10" },
        { label: "Live Instances", value: stats?.requests || 0, icon: Activity, color: "text-emerald-400", bg: "bg-emerald-500/10" },
        { label: "SLA Divergences", value: stats?.sla_breaches || 0, icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10" },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-12 pb-20">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
                    <div>
                        <div className="flex items-center space-x-2 mb-3">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full glow-indigo" />
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Command Center</span>
                        </div>
                        <h1 className="text-5xl font-black text-white mb-3 tracking-tighter uppercase italic">Admin Console</h1>
                        <p className="text-slate-400 text-lg font-medium max-w-xl leading-relaxed">System-wide orchestration metrics and protocol definition terminal.</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => router.push('/admin/workflows/create')}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-5 rounded-2xl font-black tracking-widest uppercase text-xs shadow-2xl transition-all hover:-translate-y-1 flex items-center group"
                        >
                            <Plus className="w-4 h-4 mr-3 group-hover:rotate-90 transition-transform duration-500" />
                            Define New Protocol
                        </button>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {metrics.map((m, i) => (
                        <motion.div
                            key={m.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <Card className="glass-dark border border-white/5 p-8 hover:border-white/10 transition-all flex flex-col h-full rounded-[2rem] relative overflow-hidden group">
                                <div className={`absolute top-0 right-0 w-24 h-24 ${m.bg} blur-3xl rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700`} />
                                <div className="flex items-center justify-between mb-8">
                                    <div className={`p-4 rounded-2xl ${m.bg} ${m.color} border border-current/10 shrink-0`}>
                                        <m.icon className="w-6 h-6" />
                                    </div>
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Live Telemetry</span>
                                </div>
                                <div className="mt-auto">
                                    <h4 className="text-5xl font-black text-white mb-2 tracking-tighter italic">{m.value}</h4>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{m.label}</p>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Quick Actions & Control Panels */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <Card className="lg:col-span-2 glass-dark border border-white/5 rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-10 border-b border-white/5 flex flex-row items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Security & Governance</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Node Authority & Access Controls</p>
                                </div>
                            </div>
                            <button className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-all border border-white/5">
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </CardHeader>
                        <CardContent className="p-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 rounded-3xl bg-white/5 border border-white/5 flex flex-col group cursor-pointer hover:bg-white/10 transition-all">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6 border border-indigo-500/20">
                                        <Database className="w-5 h-5" />
                                    </div>
                                    <h5 className="text-sm font-black text-white mb-2 uppercase tracking-tight">Schema Management</h5>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">Update and refine core workflow data structures.</p>
                                </div>
                                <div className="p-6 rounded-3xl bg-white/5 border border-white/5 flex flex-col group cursor-pointer hover:bg-white/10 transition-all">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 border border-purple-500/20">
                                        <Activity className="w-5 h-5" />
                                    </div>
                                    <h5 className="text-sm font-black text-white mb-2 uppercase tracking-tight">System Audit</h5>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">Review historical execution logs and diverging tasks.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-dark border border-white/5 rounded-[2.5rem] p-10 flex flex-col bg-gradient-to-br from-indigo-600/10 to-transparent">
                        <div className="w-16 h-16 rounded-3xl bg-indigo-500 flex items-center justify-center text-white mb-8 shadow-2xl shadow-indigo-500/20 glow-indigo">
                            <Play className="w-8 h-8 fill-white" />
                        </div>
                        <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4">Initialization Sequence</h3>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed mb-10">
                            Admins can override standard protocol constraints. Define custom execution pathways for emergency infrastructure adjustments.
                        </p>
                        <button
                            onClick={() => router.push('/admin/workflows/create')}
                            className="mt-auto w-full py-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                        >
                            Access Constructor
                        </button>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
