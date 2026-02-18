"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
    Activity,
    CheckCircle2,
    Clock,
    AlertCircle,
    ArrowUpRight,
    GitBranch,
    Loader2,
    Shield,
    Plus,
    Server,
    Database
} from "lucide-react";
import Portal from "@/components/ui/Portal";
import apiClient from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { animations } from "@/lib/animations";

interface Stats {
    active: number;
    completed: number;
    overdue: number;
    pending: number;
}

interface WorkflowData {
    id: string;
    name: string;
}

interface Request {
    id: string;
    status: string;
    created_at: string;
}

interface AuditLog {
    id: string;
    action: string;
    timestamp: string;
}

export default function DashboardPage() {
    const [workflows, setWorkflows] = useState<WorkflowData[]>([]);
    const [stats, setStats] = useState<Stats>({
        active: 0,
        completed: 0,
        overdue: 0,
        pending: 0
    });
    const [pulsing, setPulsing] = useState(false);
    const [recentRequests, setRecentRequests] = useState<Request[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
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
                // Parallel data fetching for performance
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
                console.error("Dashboard data fetch error", err);
                setError("Failed to load dashboard data. System may be offline.");
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
        { name: "Active Workflows", value: stats.active, icon: Activity, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", trend: "+12%" },
        { name: "Pending Tasks", value: stats.pending, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", trend: "+5%" },
        { name: "Critical Issues", value: stats.overdue, icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", trend: "-2%" },
        { name: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", trend: "+8%" },
    ];

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[70vh] space-y-6">
                    <Loader2 className="w-12 h-12 text-accent-primary animate-spin" />
                    <p className="text-text-secondary text-sm font-medium animate-pulse tracking-wider">INITIALIZING COMMAND CENTER...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
                    <AlertCircle className="w-12 h-12 text-accent-error" />
                    <p className="text-text-primary font-bold">{error}</p>
                    <Button onClick={() => window.location.reload()} variant="outline">
                        Retry Connection
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-8 max-w-[1600px] mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-1">Mission Control</h1>
                        <div className="flex items-center gap-3 text-sm">
                            <span className="flex items-center gap-2 text-text-secondary">
                                <Server className="w-4 h-4" />
                                System Status:
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider">
                                Operational
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="outline" onClick={handlePulse} disabled={pulsing} className="hidden md:flex">
                            <Activity className={`w-4 h-4 mr-2 ${pulsing ? 'animate-pulse' : ''}`} />
                            {pulsing ? "Diagnosing..." : "System Pulse"}
                        </Button>
                        <Button onClick={() => setRequestModalOpen(true)} className="bg-accent-primary hover:bg-accent-primary-hover text-white shadow-lg shadow-accent-primary/20">
                            <Plus className="w-4 h-4 mr-2" />
                            New Request
                        </Button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map((stat, i) => (
                        <motion.div
                            key={stat.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <Card className="glass-panel hover:border-accent-primary/30 transition-all duration-300 group">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-xl ${stat.bg} ${stat.border} border ${stat.color} shadow-lg shadow-black/5`}>
                                            <stat.icon className="w-6 h-6" />
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-1 rounded bg-black/20 ${stat.color.replace('text-', 'text-')}`}>
                                            {stat.trend}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-4xl font-bold text-white mb-1 group-hover:scale-105 transition-transform origin-left">
                                            {stat.value}
                                        </h3>
                                        <p className="text-xs font-bold text-text-tertiary uppercase tracking-wider">{stat.name}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Active Workflows Stream */}
                    <div className="xl:col-span-2">
                        <motion.div variants={animations.fadeInUp}>
                            <Card className="glass-panel h-full min-h-[500px]">
                                <CardHeader className="flex flex-row items-center justify-between border-b border-border px-8 py-6">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-accent-primary/10 rounded-lg">
                                            <GitBranch className="w-5 h-5 text-accent-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold text-text-primary">Live Activity Stream</CardTitle>
                                            <p className="text-xs text-text-tertiary uppercase tracking-wider mt-0.5">Real-time Instance Telemetry</p>
                                        </div>
                                    </div>
                                    <Link href="/requests">
                                        <Button variant="ghost" size="sm" className="text-xs uppercase tracking-wider font-bold text-text-secondary hover:text-white">
                                            View All
                                            <ArrowUpRight className="w-3 h-3 ml-2" />
                                        </Button>
                                    </Link>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-border/50">
                                        {recentRequests.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center p-20 text-text-tertiary">
                                                <Database className="w-12 h-12 mb-4 opacity-20" />
                                                <p className="text-sm font-medium">No active telemetry found.</p>
                                            </div>
                                        ) : (
                                            recentRequests.map((req) => (
                                                <Link
                                                    href={`/instances/${req.id}`}
                                                    key={req.id}
                                                    className="flex items-center justify-between px-8 py-5 hover:bg-surface-active transition-all group border-l-2 border-transparent hover:border-accent-primary"
                                                >
                                                    <div className="flex items-center gap-5">
                                                        <div className={`w-2 h-2 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] ${req.status === 'COMPLETED' ? 'bg-emerald-500 shadow-emerald-500/50' :
                                                            req.status === 'PENDING' ? 'bg-amber-500 shadow-amber-500/50' :
                                                                'bg-blue-500 shadow-blue-500/50'
                                                            }`} />

                                                        <div>
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <h4 className="text-sm font-bold text-text-primary group-hover:text-accent-primary transition-colors">
                                                                    REQ-{req.id.slice(0, 8).toUpperCase()}
                                                                </h4>
                                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${req.status === 'COMPLETED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                                                    req.status === 'PENDING' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                                                                        'bg-blue-500/10 border-blue-500/20 text-blue-500'
                                                                    }`}>
                                                                    {req.status}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-text-tertiary font-mono">
                                                                ID: {req.id}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xs font-bold text-text-secondary group-hover:text-text-primary transition-colors">
                                                            {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                                                        </div>
                                                        <p className="text-[10px] text-text-tertiary uppercase tracking-wider mt-1">Initiated</p>
                                                    </div>
                                                </Link>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Security Logs */}
                    <div>
                        <motion.div variants={animations.fadeInUp}>
                            <Card className="glass-panel h-full">
                                <CardHeader className="border-b border-border px-6 py-6">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-accent-secondary/10 rounded-lg">
                                            <Shield className="w-5 h-5 text-accent-secondary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold text-text-primary">Security Log</CardTitle>
                                            <p className="text-xs text-text-tertiary uppercase tracking-wider mt-0.5">Audit & Access Control</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="relative border-l border-border ml-3 space-y-8">
                                        {auditLogs.length === 0 ? (
                                            <div className="py-12 text-center ml-4">
                                                <p className="text-sm text-text-secondary">System logs verified clean.</p>
                                            </div>
                                        ) : (
                                            auditLogs.map((log) => (
                                                <div key={log.id} className="relative ml-6">
                                                    <span className="absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-accent-secondary"></span>
                                                    <div>
                                                        <p className="text-sm font-medium text-text-primary leading-none mb-1">
                                                            {log.action.replace(/_/g, ' ')}
                                                        </p>
                                                        <time className="text-xs text-text-tertiary font-mono">
                                                            {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                                        </time>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>

                {/* New Request Modal */}
                <AnimatePresence>
                    {requestModalOpen && (
                        <Portal>
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setRequestModalOpen(false)}
                                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                    className="w-full max-w-lg glass-panel border border-border/50 rounded-2xl p-0 relative overflow-hidden shadow-2xl z-10"
                                >
                                    <div className="px-6 py-5 border-b border-border bg-white/5">
                                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                            <Plus className="w-5 h-5 text-accent-primary" />
                                            Initialize Protocol
                                        </h2>
                                        <p className="text-xs text-text-secondary uppercase tracking-wider mt-1">Start a new operational workflow</p>
                                    </div>

                                    <div className="p-6 space-y-5">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Protocol Selection</label>
                                            <select
                                                className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all appearance-none"
                                                value={newRequestData.workflow_id}
                                                onChange={(e) => setNewRequestData({ ...newRequestData, workflow_id: e.target.value })}
                                            >
                                                <option value="" className="text-gray-500">Select Protocol Blueprint...</option>
                                                {workflows.map(w => (
                                                    <option key={w.id} value={w.id} className="bg-slate-900">{w.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Operation Title</label>
                                            <input
                                                type="text"
                                                className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-text-tertiary"
                                                placeholder="e.g. System Provisioning Alpha"
                                                value={newRequestData.title}
                                                onChange={(e) => setNewRequestData({ ...newRequestData, title: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Operational Context</label>
                                            <textarea
                                                className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all h-24 resize-none placeholder:text-text-tertiary"
                                                placeholder="Provide detailed context for this execution..."
                                                value={newRequestData.description}
                                                onChange={(e) => setNewRequestData({ ...newRequestData, description: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Priority Level</label>
                                            <div className="flex gap-3">
                                                {['low', 'medium', 'high'].map((p) => (
                                                    <button
                                                        key={p}
                                                        onClick={() => setNewRequestData({ ...newRequestData, priority: p })}
                                                        className={`flex-1 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${newRequestData.priority === p
                                                            ? 'bg-accent-primary border-accent-primary text-white shadow-lg shadow-accent-primary/20'
                                                            : 'bg-surface border-border text-text-tertiary hover:text-white hover:border-text-secondary'
                                                            }`}
                                                    >
                                                        {p}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 pt-0 flex gap-4">
                                        <Button
                                            variant="ghost"
                                            onClick={() => setRequestModalOpen(false)}
                                            className="flex-1 rounded-xl"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleStartRequest}
                                            disabled={isStartingRequest}
                                            className="flex-[2] bg-accent-primary hover:bg-accent-primary-hover text-white rounded-xl shadow-lg shadow-accent-primary/25"
                                        >
                                            {isStartingRequest ? <Loader2 className="w-4 h-4 animate-spin" /> : "Initialize Protocol"}
                                        </Button>
                                    </div>
                                </motion.div>
                            </div>
                        </Portal>
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
}
