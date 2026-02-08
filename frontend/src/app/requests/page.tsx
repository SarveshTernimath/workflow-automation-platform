"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Search, Loader2, GitBranch, ArrowRight, Filter, Clock } from "lucide-react";
import apiClient from "@/lib/api";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

interface WorkflowRequest {
    id: string;
    workflow_id: string;
    requester_id: string;
    status: string;
    request_data: any;
    created_at: string;
    updated_at: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    CREATED: { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20", glow: "shadow-slate-500/5" },
    IN_PROGRESS: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20", glow: "shadow-indigo-500/5" },
    APPROVED: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", glow: "shadow-emerald-500/5" },
    REJECTED: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20", glow: "shadow-rose-500/5" },
    COMPLETED: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", glow: "shadow-emerald-500/5" },
    ESCALATED: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", glow: "shadow-amber-500/5" },
};

export default function RequestsPage() {
    const [requests, setRequests] = useState<WorkflowRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const router = useRouter();

    useEffect(() => {
        fetchRequests();
    }, [statusFilter]);

    async function fetchRequests() {
        try {
            const params = statusFilter ? `?status=${statusFilter}` : "";
            const res = await apiClient.get(`/requests/${params}`);
            setRequests(res.data);
        } catch (err) {
            console.error("Failed to fetch requests", err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-[60vh] space-y-8">
                    <div className="relative">
                        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                        <div className="absolute inset-0 blur-xl bg-indigo-500/20 rounded-full animate-pulse" />
                    </div>
                    <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px] animate-pulse">Syncing Operational Data</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
                    <div>
                        <div className="flex items-center space-x-2 mb-3">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Operational Ledger</span>
                        </div>
                        <h1 className="text-5xl font-black text-white mb-3 tracking-tighter uppercase italic">Request Audit</h1>
                        <p className="text-slate-400 text-lg font-medium max-w-xl">Track, monitor, and audit every strategic workflow instance across the infrastructure.</p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search instance hash..."
                            className="w-full bg-slate-900 border border-white/5 rounded-2xl py-5 pl-14 pr-5 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium"
                        />
                    </div>

                    <div className="flex items-center gap-3 bg-slate-900 border border-white/5 rounded-2xl px-6 py-5 group">
                        <Filter className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent text-white focus:outline-none font-bold uppercase tracking-widest text-[10px] cursor-pointer"
                        >
                            <option value="" className="bg-slate-900">All Nodes</option>
                            <option value="IN_PROGRESS" className="bg-slate-900">Active</option>
                            <option value="COMPLETED" className="bg-slate-900">Fulfilled</option>
                            <option value="REJECTED" className="bg-slate-900">Terminated</option>
                            <option value="ESCALATED" className="bg-slate-900">Escalated</option>
                        </select>
                    </div>
                </div>

                {requests.length === 0 ? (
                    <Card className="py-40 flex flex-col items-center justify-center glass-dark border-dashed border-white/10 rounded-[3rem] shadow-2xl">
                        <div className="p-8 rounded-3xl bg-slate-900 border border-white/5 mb-8">
                            <GitBranch className="w-16 h-16 text-slate-800" />
                        </div>
                        <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px] mb-2">No active sequences discovered</p>
                        <p className="text-slate-600 font-medium text-sm italic opacity-60">Initialize a strategy from the inventory to begin tracking.</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {requests.map((request, index) => {
                            const statusStyle = STATUS_COLORS[request.status] || STATUS_COLORS.CREATED;
                            return (
                                <motion.div
                                    key={request.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                >
                                    <div
                                        onClick={() => router.push(`/requests/${request.id}`)}
                                        className="group relative"
                                    >
                                        <Card
                                            className="glass-dark border border-white/5 hover:border-indigo-500/50 transition-all duration-500 cursor-pointer overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-indigo-500/5 p-8"
                                        >
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                                                <div className="flex items-center gap-8 flex-1">
                                                    <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                                        <GitBranch className="w-8 h-8 text-indigo-400" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex flex-wrap items-center gap-4 mb-3">
                                                            <h3 className="text-2xl font-black text-white group-hover:text-indigo-400 transition-colors uppercase italic tracking-tighter">
                                                                Instance #{request.id.slice(0, 8).toUpperCase()}
                                                            </h3>
                                                            <div className={`px-4 py-1.5 rounded-full ${statusStyle.bg} border ${statusStyle.border} ${statusStyle.text} text-[10px] font-black uppercase tracking-[0.2em] ${statusStyle.glow}`}>
                                                                {request.status.replace(/_/g, ' ')}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-6 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                                            <span className="flex items-center"><Clock className="w-3 h-3 mr-2" /> {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}</span>
                                                            <span className="flex items-center opacity-40 italic font-medium">Core Blueprint: {request.workflow_id}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button className="h-14 px-8 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500 flex items-center gap-3 font-black uppercase text-[10px] tracking-widest shadow-lg">
                                                    Analyze Trace
                                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                </button>
                                            </div>

                                            {/* Decorative background element on hover */}
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[60px] rounded-full group-hover:bg-indigo-500/10 transition-colors duration-500 -z-10" />
                                        </Card>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

