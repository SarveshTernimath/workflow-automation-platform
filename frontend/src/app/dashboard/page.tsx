"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Activity, CheckCircle2, Clock, AlertCircle, ArrowUpRight, GitBranch, Loader2, Shield, Zap, Cpu } from "lucide-react";
import apiClient from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Stats {
    active: number;
    completed: number;
    overdue: number;
    pending: number;
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
};

export default function DashboardPage() {
    const [stats, setStats] = useState<Stats>({
        active: 0,
        completed: 0,
        overdue: 0,
        pending: 0
    });
    const [pulsing, setPulsing] = useState(false);
    const [recentRequests, setRecentRequests] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [statsRes, reqsRes, auditRes] = await Promise.all([
                    apiClient.get("/requests/stats"),
                    apiClient.get("/requests/"),
                    apiClient.get("/audit/")
                ]);

                setStats(statsRes.data);
                setRecentRequests(reqsRes.data.slice(0, 5));
                setAuditLogs(auditRes.data.slice(0, 5));
            } catch (err) {
                console.error("Dashboard recovery error", err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const handlePulse = () => {
        setPulsing(true);
        setTimeout(() => setPulsing(false), 2000);
    };

    const statCards = [
        { name: "Executive Flows", value: stats.active, icon: Activity, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", glow: "shadow-indigo-500/10" },
        { name: "Strategic Tasks", value: stats.pending, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", glow: "shadow-amber-500/10" },
        { name: "SLA Incidents", value: stats.overdue, icon: AlertCircle, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", glow: "shadow-rose-500/10" },
        { name: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", glow: "shadow-emerald-500/10" },
    ];

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[60vh] space-y-8">
                    <div className="relative">
                        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                        <div className="absolute inset-0 blur-xl bg-indigo-500/20 rounded-full animate-pulse" />
                    </div>
                    <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px] animate-pulse">Calibrating NexusFlow Core</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-12"
            >
                <motion.div variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
                    <div>
                        <div className="flex items-center space-x-2 mb-3">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Operational Nexus</span>
                        </div>
                        <h1 className="text-5xl font-black text-white mb-3 tracking-tighter uppercase italic">NexusFlow Dashboard</h1>
                        <p className="text-slate-400 text-lg font-medium max-w-xl leading-relaxed">High-fidelity orchestration monitoring and real-time system telemetry across the operational grid.</p>
                    </div>
                    <button
                        onClick={handlePulse}
                        disabled={pulsing}
                        className={`group flex items-center space-x-4 px-8 py-5 rounded-2xl transition-all duration-500 font-black tracking-widest uppercase text-xs shadow-2xl relative overflow-hidden ${pulsing
                            ? "bg-indigo-500/20 text-indigo-400 cursor-wait border border-indigo-500/30"
                            : "bg-indigo-500 text-white hover:bg-indigo-600 hover:-translate-y-1 hover:shadow-indigo-500/30 active:translate-y-0"
                            }`}
                    >
                        {pulsing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Synchronizing Pulse...</span>
                            </>
                        ) : (
                            <>
                                <Zap className="w-4 h-4 group-hover:scale-125 transition-transform" />
                                <span>Initialize Core Pulse</span>
                            </>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </button>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
                    {statCards.map((stat) => (
                        <motion.div variants={item} key={stat.name}>
                            <Card className={`p-8 glass-dark group hover:-translate-y-2 transition-all duration-500 border border-white/5 hover:border-white/10 relative overflow-hidden shadow-2xl ${stat.glow}`}>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full opacity-50 group-hover:scale-125 transition-transform duration-700" />
                                <div className="flex items-center justify-between mb-8 relative z-10">
                                    <div className={`p-4 rounded-2xl ${stat.bg} ${stat.border} shadow-lg`}>
                                        <stat.icon className={`w-8 h-8 ${stat.color}`} />
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                                        <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-white" />
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-2">{stat.name}</p>
                                    <div className="flex items-end space-x-3">
                                        <motion.h3
                                            animate={pulsing ? {
                                                scale: [1, 1.1, 1],
                                                opacity: [1, 0.7, 1]
                                            } : {}}
                                            transition={{ duration: 1, repeat: pulsing ? Infinity : 0 }}
                                            className="text-5xl font-black text-white tracking-tighter"
                                        >
                                            {stat.value}
                                        </motion.h3>
                                        {pulsing && (
                                            <motion.div
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="text-[10px] text-indigo-400 font-black uppercase mb-2 tracking-widest"
                                            >
                                                Live
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <motion.div variants={item} className="lg:col-span-2">
                        <Card className="glass-dark border border-white/5 overflow-hidden shadow-2xl">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 p-8 bg-white/2">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 rounded-lg bg-indigo-500/10">
                                        <Activity className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <CardTitle className="text-lg font-black tracking-widest uppercase italic">Stream Telemetry</CardTitle>
                                </div>
                                <Link href="/requests" className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-slate-400 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest">
                                    Full Data Base
                                </Link>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-white/5">
                                    {recentRequests.length === 0 ? (
                                        <div className="p-24 text-center">
                                            <div className="inline-flex p-6 rounded-3xl bg-slate-900 border border-white/5 mb-6 animate-pulse shadow-2xl">
                                                <GitBranch className="w-12 h-12 text-slate-700" />
                                            </div>
                                            <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Awaiting telemetry stream initialization...</p>
                                        </div>
                                    ) : (
                                        recentRequests.map((req: any) => (
                                            <Link href={`/requests/${req.id}`} key={req.id} className="flex items-center justify-between p-8 hover:bg-white/[0.03] transition-all group border-l-4 border-transparent hover:border-indigo-500">
                                                <div className="flex items-center space-x-6">
                                                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-all duration-500 border border-white/5 shadow-inner">
                                                        <GitBranch className="w-8 h-8" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-white font-black tracking-tight mb-1 uppercase italic italic">Request <span className="text-indigo-400 font-mono tracking-normal not-italic ml-2">#{req.id.slice(0, 8).toUpperCase()}</span></h4>
                                                        <div className="flex items-center space-x-3">
                                                            <div className={`w-2 h-2 rounded-full ${req.status === 'COMPLETED' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-indigo-500 shadow-[0_0_8px_#6366f1]'} animate-pulse`} />
                                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{req.status}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2">{formatDistanceToNow(new Date(req.created_at))} ago</div>
                                                    <ArrowUpRight className="ml-auto w-5 h-5 text-slate-700 group-hover:text-indigo-400 transition-all duration-500 group-hover:-translate-y-1 group-hover:translate-x-1" />
                                                </div>
                                            </Link>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div variants={item}>
                        <Card className="glass-dark border border-white/5 h-full shadow-2xl overflow-hidden">
                            <CardHeader className="border-b border-white/5 p-8 bg-white/2">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 rounded-lg bg-emerald-500/10">
                                        <Shield className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <CardTitle className="text-lg font-black tracking-widest uppercase italic">Security Intel</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="space-y-10">
                                    {auditLogs.length === 0 ? (
                                        <div className="py-20 text-center space-y-4">
                                            <div className="flex justify-center flex-wrap gap-1.5">
                                                {[...Array(8)].map((_, i) => (
                                                    <div key={i} className="w-1.5 h-4 bg-slate-800 rounded-full animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                                                ))}
                                            </div>
                                            <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em]">Encrypted Buffer Verified</p>
                                        </div>
                                    ) : (
                                        auditLogs.map((log: any, i) => (
                                            <div key={log.id} className="flex space-x-6 group relative">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-4 h-4 rounded-full border-2 border-emerald-500/30 bg-background shadow-[0_0_10px_rgba(16,185,129,0.2)] mt-2 group-hover:scale-125 transition-all duration-500" />
                                                    {i < auditLogs.length - 1 && <div className="w-px flex-1 bg-gradient-to-b from-emerald-500/30 via-slate-800 to-transparent my-3" />}
                                                </div>
                                                <div className="flex-1 pb-6">
                                                    <p className="text-sm font-bold text-white/90 group-hover:text-white transition-colors leading-relaxed tracking-tight">
                                                        <span className="text-emerald-400 italic mr-2 text-[10px] font-black uppercase tracking-widest">LOG</span>
                                                        {log.action.replace(/_/g, ' ').toUpperCase()}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-2 opacity-60">{formatDistanceToNow(new Date(log.timestamp))} ago</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="mt-8 p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <Cpu className="w-4 h-4 text-indigo-400" />
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">System Load</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: "34%" }}
                                            transition={{ duration: 2, ease: "easeOut" }}
                                            className="h-full bg-indigo-500 shadow-[0_0_10px_#6366f1]"
                                        />
                                    </div>
                                    <div className="flex justify-between mt-2">
                                        <span className="text-[8px] font-black text-slate-600 uppercase">Idle</span>
                                        <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Optimal</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </motion.div>
        </DashboardLayout>
    );
}

