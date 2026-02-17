"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Activity, CheckCircle2, Clock, AlertCircle, ArrowUpRight, GitBranch, Loader2, Shield, Zap, Cpu, Plus } from "lucide-react";
import Portal from "@/components/ui/Portal";
import apiClient from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
    const [workflows, setWorkflows] = useState<any[]>([]);
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
    const router = useRouter();

    const [isStartingRequest, setIsStartingRequest] = useState(false);
    const [requestModalOpen, setRequestModalOpen] = useState(false);
    const [newRequestData, setNewRequestData] = useState({
        workflow_id: "",
        title: "",
        description: "",
        priority: "medium"
    });

    useEffect(() => {
        async function fetchData() {
            try {
                const [statsRes, reqsRes, auditRes, wfRes] = await Promise.all([
                    apiClient.get("requests/stats"),
                    apiClient.get("requests/"),
                    apiClient.get("audit/"),
                    apiClient.get("workflows/")
                ]);

                setStats(statsRes.data);
                setRecentRequests(reqsRes.data.slice(0, 5));
                setAuditLogs(auditRes.data.slice(0, 5));
                setWorkflows(wfRes.data);
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

    const handleStartRequest = async () => {
        if (!newRequestData.workflow_id || !newRequestData.title) {
            alert("Please select a workflow and provide a title.");
            return;
        }

        setIsStartingRequest(true);
        try {
            const payload = {
                title: newRequestData.title,
                description: newRequestData.description,
                priority: newRequestData.priority
            };

            const res = await apiClient.post("/requests/", {
                workflow_id: newRequestData.workflow_id,
                request_data: payload
            });

            router.push(`/instances/${res.data.id}`);
        } catch (err) {
            console.error("Failed to start request", err);
            alert("Failed to initialize request.");
            setIsStartingRequest(false);
        }
    };

    const statCards = [
        { name: "Executive Flows", value: stats.active, icon: Activity, color: "text-[#00ff80]", bg: "bg-[#00ff80]/10", border: "border-[#00ff80]/20", glow: "shadow-[#00ff80]/10" },
        { name: "Strategic Tasks", value: stats.pending, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", glow: "shadow-amber-500/10" },
        { name: "SLA Incidents", value: stats.overdue, icon: AlertCircle, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", glow: "shadow-rose-500/10" },
        { name: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-slate-200", bg: "bg-slate-500/10", border: "border-slate-500/20", glow: "shadow-slate-500/10" },
    ];

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[60vh] space-y-8">
                    <div className="relative">
                        <Loader2 className="w-12 h-12 text-[#00ff80] animate-spin" />
                        <div className="absolute inset-0 blur-xl bg-[#00ff80]/20 rounded-full animate-pulse" />
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
                            <span className="w-2 h-2 bg-[#00ff80] rounded-full animate-ping" />
                            <span className="text-[10px] font-black text-[#00ff80] uppercase tracking-[0.3em]">Operational Nexus</span>
                        </div>
                        <h1 className="text-5xl font-black text-white mb-3 tracking-tighter uppercase italic">NexusFlow Dashboard</h1>
                        <p className="text-slate-400 text-lg font-medium max-w-xl leading-relaxed">High-fidelity orchestration monitoring and real-time system telemetry across the operational grid.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 relative z-50">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setRequestModalOpen(true);
                            }}
                            className="group flex items-center space-x-4 px-8 py-5 rounded-2xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all font-black tracking-widest uppercase text-xs cursor-pointer active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Start New Request</span>
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handlePulse();
                            }}
                            disabled={pulsing}
                            className={`group flex items-center space-x-4 px-8 py-5 rounded-2xl transition-all duration-500 font-black tracking-widest uppercase text-xs shadow-2xl relative overflow-hidden cursor-pointer active:scale-95 ${pulsing
                                ? "bg-[#00ff80]/20 text-[#00ff80] cursor-wait border border-[#00ff80]/30"
                                : "bg-[#00ff80] text-black hover:bg-[#00cc66] hover:-translate-y-1 hover:shadow-[#00ff80]/30"
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
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        </button>
                    </div>
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
                                                className="text-[10px] text-[#00ff80] font-black uppercase mb-2 tracking-widest"
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
                    {/* ... Existing Telemetry Cards with Neon Updates ... */}
                    <motion.div variants={item} className="lg:col-span-2">
                        <Card className="glass-dark border border-white/5 overflow-hidden shadow-2xl">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 p-8 bg-white/2">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 rounded-lg bg-[#00ff80]/10">
                                        <Activity className="w-5 h-5 text-[#00ff80]" />
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
                                            <Link href={`/instances/${req.id}`} key={req.id} className="flex items-center justify-between p-8 hover:bg-white/[0.03] transition-all group border-l-4 border-transparent hover:border-[#00ff80]">
                                                <div className="flex items-center space-x-6">
                                                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-[#00ff80]/20 group-hover:text-[#00ff80] transition-all duration-500 border border-white/5 shadow-inner">
                                                        <GitBranch className="w-8 h-8" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-white font-black tracking-tight mb-1 uppercase italic italic">Request <span className="text-[#00ff80] font-mono tracking-normal not-italic ml-2">#{req.id.slice(0, 8).toUpperCase()}</span></h4>
                                                        <div className="flex items-center space-x-3">
                                                            <div className={`w-2 h-2 rounded-full ${req.status === 'COMPLETED' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-[#00ff80] shadow-[0_0_8px_#00ff80]'} animate-pulse`} />
                                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{req.status}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2">{formatDistanceToNow(new Date(req.created_at))} ago</div>
                                                    <ArrowUpRight className="ml-auto w-5 h-5 text-slate-700 group-hover:text-[#00ff80] transition-all duration-500 group-hover:-translate-y-1 group-hover:translate-x-1" />
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
                            {/* ... Security Intel Card (Neon Update) ... */}
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
                                            {/* ... Skeletons ... */}
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
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* START REQUEST MODAL */}
                <AnimatePresence>
                    {requestModalOpen && (
                        <Portal>
                            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setRequestModalOpen(false)}
                                    className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                    className="w-full max-w-2xl glass-dark border border-[#00ff80]/20 rounded-[3rem] p-10 relative overflow-hidden shadow-[0_0_50px_rgba(0,255,128,0.1)]"
                                >
                                    {/* Neon Glow Background */}
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#00ff80]/10 blur-[80px] rounded-full -z-10" />

                                    <div className="mb-8">
                                        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Initialize New Request</h2>
                                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-2">Submit operational requirements for processing.</p>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <label htmlFor="protocol-select" className="text-[10px] font-black text-[#00ff80] uppercase tracking-widest mb-2 block">Select Protocol</label>
                                            <select
                                                id="protocol-select"
                                                name="protocol"
                                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-white text-sm focus:outline-none focus:border-[#00ff80] transition-colors appearance-none"
                                                value={newRequestData.workflow_id}
                                                onChange={(e) => setNewRequestData({ ...newRequestData, workflow_id: e.target.value })}
                                            >
                                                <option value="">-- Choose Protocol --</option>
                                                {workflows.map(w => (
                                                    <option key={w.id} value={w.id}>{w.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label htmlFor="request-title" className="text-[10px] font-black text-[#00ff80] uppercase tracking-widest mb-2 block">Request Title</label>
                                            <input
                                                id="request-title"
                                                name="title"
                                                type="text"
                                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-white text-sm focus:outline-none focus:border-[#00ff80] transition-colors"
                                                placeholder="e.g. Server Provisioning for AI Team"
                                                value={newRequestData.title}
                                                onChange={(e) => setNewRequestData({ ...newRequestData, title: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="request-description" className="text-[10px] font-black text-[#00ff80] uppercase tracking-widest mb-2 block">Context / Description</label>
                                            <textarea
                                                id="request-description"
                                                name="description"
                                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-white text-sm focus:outline-none focus:border-[#00ff80] transition-colors h-32 resize-none"
                                                placeholder="Provide necessary functional details..."
                                                value={newRequestData.description}
                                                onChange={(e) => setNewRequestData({ ...newRequestData, description: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-[#00ff80] uppercase tracking-widest mb-2 block">Priority Level</label>
                                            <div className="flex gap-4">
                                                {['low', 'medium', 'high'].map((p) => (
                                                    <button
                                                        key={p}
                                                        onClick={() => setNewRequestData({ ...newRequestData, priority: p })}
                                                        className={`flex-1 py-3 rounded-xl border font-bold uppercase tracking-widest text-[10px] transition-all ${newRequestData.priority === p
                                                            ? 'bg-[#00ff80] text-black border-[#00ff80]'
                                                            : 'bg-transparent border-white/10 text-slate-500 hover:text-white'
                                                            }`}
                                                    >
                                                        {p}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex gap-4 pt-4">
                                            <button
                                                onClick={() => setRequestModalOpen(false)}
                                                className="flex-1 py-4 rounded-xl border border-white/10 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-white/5 transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleStartRequest}
                                                disabled={isStartingRequest}
                                                className="flex-[2] py-4 rounded-xl bg-[#00ff80] hover:bg-[#00cc66] text-black font-black uppercase tracking-widest text-[10px] shadow-[0_0_20px_rgba(0,255,128,0.3)] flex items-center justify-center transition-all hover:scale-[1.02]"
                                            >
                                                {isStartingRequest ? <Loader2 className="w-4 h-4 animate-spin" /> : "Initialize Request"}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </Portal>
                    )}
                </AnimatePresence>
            </motion.div>
        </DashboardLayout>
    );
}

