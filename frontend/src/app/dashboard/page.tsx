"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Activity, CheckCircle2, Clock, AlertCircle, ArrowUpRight, GitBranch, Loader2, Shield, Zap, Plus } from "lucide-react";
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
        { name: "Executive Flows", value: stats.active, icon: Activity, color: "text-accent-primary", glow: "shadow-accent-primary/20", trend: "+12%" },
        { name: "Strategic Tasks", value: stats.pending, icon: Clock, color: "text-accent-warning", glow: "shadow-accent-warning/20", trend: "+5%" },
        { name: "SLA Incidents", value: stats.overdue, icon: AlertCircle, color: "text-accent-error", glow: "shadow-accent-error/20", trend: "-2%" },
        { name: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-accent-secondary", glow: "shadow-accent-secondary/20", trend: "+8%" },
    ];

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                    <Loader2 className="w-10 h-10 text-accent-primary animate-spin" />
                    <p className="text-sm font-medium text-text-secondary animate-pulse">Initializing Dashboard...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <motion.div
                variants={animations.staggerContainer}
                initial="hidden"
                animate="show"
                className="space-y-8"
            >
                {/* Hero Section */}
                <motion.div variants={animations.fadeInUp} className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                    <div>
                        <div className="flex items-center space-x-2 mb-2">
                            <span className="w-2 h-2 bg-accent-primary rounded-full animate-pulse" />
                            <span className="text-xs font-bold text-accent-primary tracking-widest uppercase">Operational Nexus</span>
                        </div>
                        <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Dashboard</h1>
                        <p className="text-text-secondary max-w-xl">Real-time orchestration monitoring and system telemetry.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => setRequestModalOpen(true)}
                            className="bg-surface border-border hover:bg-surface-hover"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Start New Request
                        </Button>
                        <Button
                            onClick={handlePulse}
                            disabled={pulsing}
                            className={pulsing ? "opacity-80 cursor-wait" : ""}
                        >
                            {pulsing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Syncing...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-4 h-4 mr-2" />
                                    Initialize Pulse
                                </>
                            )}
                        </Button>
                    </div>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map((stat) => (
                        <motion.div variants={animations.fadeInUp} key={stat.name}>
                            <Card className="hover:-translate-y-1 hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
                                <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${stat.color}`}>
                                    <stat.icon className="w-16 h-16" />
                                </div>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4 relative z-10">
                                        <div className={`p-3 rounded-lg bg-surface-elevated/50 border border-border ${stat.color}`}>
                                            <stat.icon className="w-6 h-6" />
                                        </div>
                                        <div className="flex items-center space-x-1 text-xs font-medium text-text-secondary bg-surface-hover px-2 py-1 rounded-full">
                                            <span>{stat.trend}</span>
                                        </div>
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-1">{stat.name}</p>
                                        <motion.h3
                                            key={stat.value}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-3xl font-bold text-white tracking-tight"
                                        >
                                            {stat.value}
                                        </motion.h3>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Activity Feed */}
                    <motion.div variants={animations.fadeInUp} className="lg:col-span-2">
                        <Card className="h-full">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-border p-6">
                                <div className="flex items-center space-x-2">
                                    <Activity className="w-5 h-5 text-accent-primary" />
                                    <CardTitle>Stream Telemetry</CardTitle>
                                </div>
                                <Link href="/requests">
                                    <Button variant="ghost" size="sm" className="text-xs uppercase tracking-wider">
                                        View All
                                        <ArrowUpRight className="w-3 h-3 ml-1" />
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-border">
                                    {recentRequests.length === 0 ? (
                                        <div className="p-12 text-center text-text-tertiary">
                                            <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p className="text-sm font-medium">Awaiting telemetry stream...</p>
                                        </div>
                                    ) : (
                                        recentRequests.map((req) => (
                                            <Link href={`/instances/${req.id}`} key={req.id} className="flex items-center justify-between p-6 hover:bg-surface-hover transition-colors group">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-10 h-10 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-text-secondary group-hover:text-accent-primary group-hover:border-accent-primary/30 transition-colors">
                                                        <GitBranch className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-white mb-1 group-hover:text-accent-primary transition-colors">
                                                            REQ-{req.id.slice(0, 8).toUpperCase()}
                                                        </h4>
                                                        <div className="flex items-center space-x-2">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${req.status === 'COMPLETED' ? 'bg-accent-success' : 'bg-accent-primary'}`} />
                                                            <p className="text-xs font-medium text-text-secondary uppercase">{req.status}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs font-medium text-text-tertiary mb-1">{formatDistanceToNow(new Date(req.created_at))} ago</div>
                                                </div>
                                            </Link>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Security Logs */}
                    <motion.div variants={animations.fadeInUp}>
                        <Card className="h-full">
                            <CardHeader className="border-b border-border p-6">
                                <div className="flex items-center space-x-2">
                                    <Shield className="w-5 h-5 text-accent-secondary" />
                                    <CardTitle>System Logs</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-6">
                                    {auditLogs.length === 0 ? (
                                        <div className="py-12 text-center text-text-tertiary">
                                            <p className="text-sm font-medium">System logs verified</p>
                                        </div>
                                    ) : (
                                        auditLogs.map((log, i) => (
                                            <div key={log.id} className="flex space-x-4 relative">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-2 h-2 rounded-full bg-surface-elevated border border-accent-secondary/50 mt-2" />
                                                    {i < auditLogs.length - 1 && <div className="w-px flex-1 bg-border my-1" />}
                                                </div>
                                                <div className="flex-1 pb-2">
                                                    <p className="text-sm font-medium text-text-primary">
                                                        {log.action.replace(/_/g, ' ')}
                                                    </p>
                                                    <p className="text-xs text-text-tertiary mt-1">
                                                        {formatDistanceToNow(new Date(log.timestamp))} ago
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Modals */}
                <AnimatePresence>
                    {requestModalOpen && (
                        <Portal>
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setRequestModalOpen(false)}
                                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                    className="w-full max-w-lg glass-dark border border-border rounded-xl p-0 relative overflow-hidden shadow-2xl z-10"
                                >
                                    <div className="p-6 border-b border-border">
                                        <h2 className="text-xl font-bold text-white">New Request</h2>
                                        <p className="text-sm text-text-secondary mt-1">Initialize a new operational workflow.</p>
                                    </div>

                                    <div className="p-6 space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Protocol</label>
                                            <select
                                                className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-primary transition-colors"
                                                value={newRequestData.workflow_id}
                                                onChange={(e) => setNewRequestData({ ...newRequestData, workflow_id: e.target.value })}
                                            >
                                                <option value="">Select Protocol</option>
                                                {workflows.map(w => (
                                                    <option key={w.id} value={w.id}>{w.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Title</label>
                                            <input
                                                type="text"
                                                className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-primary transition-colors"
                                                placeholder="e.g. System Provisioning"
                                                value={newRequestData.title}
                                                onChange={(e) => setNewRequestData({ ...newRequestData, title: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Description</label>
                                            <textarea
                                                className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-primary transition-colors h-24 resize-none"
                                                placeholder="Operational context..."
                                                value={newRequestData.description}
                                                onChange={(e) => setNewRequestData({ ...newRequestData, description: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Priority</label>
                                            <div className="flex gap-2">
                                                {['low', 'medium', 'high'].map((p) => (
                                                    <button
                                                        key={p}
                                                        onClick={() => setNewRequestData({ ...newRequestData, priority: p })}
                                                        className={`flex-1 py-1.5 rounded-md border text-xs font-medium uppercase transition-all ${newRequestData.priority === p
                                                            ? 'bg-accent-primary border-accent-primary text-white'
                                                            : 'bg-transparent border-border text-text-secondary hover:text-white'
                                                            }`}
                                                    >
                                                        {p}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 pt-0 flex gap-3">
                                        <Button
                                            variant="secondary"
                                            onClick={() => setRequestModalOpen(false)}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleStartRequest}
                                            disabled={isStartingRequest}
                                            className="flex-1"
                                        >
                                            {isStartingRequest ? <Loader2 className="w-4 h-4 animate-spin" /> : "Initialize"}
                                        </Button>
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
