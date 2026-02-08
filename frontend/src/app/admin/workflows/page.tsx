"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Plus, GitBranch, Trash2, Edit, Loader2 } from "lucide-react";
import apiClient from "@/lib/api";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

interface Workflow {
    id: string;
    name: string;
    description: string;
    steps: any[];
    is_active: boolean;
    created_at: string;
}

export default function WorkflowsListPage() {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchWorkflows();
    }, []);

    async function fetchWorkflows() {
        try {
            const res = await apiClient.get("/workflows/");
            setWorkflows(res.data);
        } catch (err) {
            console.error("Failed to fetch workflows", err);
        } finally {
            setLoading(false);
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this workflow? This action cannot be undone.")) return;
        try {
            await apiClient.delete(`/workflows/${id}`);
            setWorkflows(workflows.filter(w => w.id !== id));
        } catch (err) {
            console.error("Failed to delete workflow", err);
            alert("Failed to delete workflow. Ensure it has no active requests.");
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-[60vh]">
                    <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
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
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">System Administration</span>
                        </div>
                        <h1 className="text-5xl font-black text-white mb-3 tracking-tighter uppercase italic">Workflow Protocols</h1>
                        <p className="text-slate-400 text-lg font-medium max-w-xl">Define and manage the operational logic matrices for the platform.</p>
                    </div>
                    <button
                        onClick={() => router.push('/admin/workflows/create')}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black tracking-widest uppercase text-xs shadow-2xl transition-all hover:-translate-y-1 flex items-center group"
                    >
                        <Plus className="w-4 h-4 mr-3 group-hover:rotate-90 transition-transform duration-500" />
                        Create New Protocol
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {workflows.length === 0 ? (
                        <Card className="py-24 flex flex-col items-center justify-center glass-dark border-dashed border-white/10">
                            <div className="p-6 rounded-3xl bg-slate-900 border border-white/5 mb-6 opacity-50">
                                <GitBranch className="w-12 h-12 text-slate-500" />
                            </div>
                            <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">No protocols defined.</p>
                        </Card>
                    ) : (
                        workflows.map((wf) => (
                            <div key={wf.id} className="group glass-dark border border-white/5 p-8 rounded-3xl hover:border-indigo-500/30 transition-all duration-300 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center shrink-0">
                                        <GitBranch className="w-8 h-8 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white tracking-tight uppercase italic mb-2">{wf.name}</h3>
                                        <p className="text-slate-400 text-sm font-medium opacity-80 max-w-2xl">{wf.description}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8">
                                    <div className="text-right hidden md:block">
                                        <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Complexity</div>
                                        <div className="text-white font-bold">{wf.steps?.length || 0} Nodes</div>
                                    </div>
                                    <div className="text-right hidden md:block">
                                        <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Created</div>
                                        <div className="text-white font-bold">{formatDistanceToNow(new Date(wf.created_at))} ago</div>
                                    </div>

                                    <div className="flex items-center gap-3 pl-8 border-l border-white/5">
                                        {/* <button className="p-3 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                                            <Edit className="w-5 h-5" />
                                        </button> */}
                                        <button
                                            onClick={() => handleDelete(wf.id)}
                                            className="p-3 rounded-xl hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
