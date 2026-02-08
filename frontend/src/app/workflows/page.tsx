"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Plus, Play, Info, MoreVertical, Loader2 } from "lucide-react";
import apiClient from "@/lib/api";
import { useRouter } from "next/navigation";

export default function WorkflowsPage() {
    const [workflows, setWorkflows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        async function fetchData() {
            try {
                const [wfRes, userRes] = await Promise.all([
                    apiClient.get("/workflows/"),
                    apiClient.get("/users/me")
                ]);
                setWorkflows(wfRes.data);
                setUser(userRes.data);
            } catch (err) {
                console.error("Failed to fetch data", err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const handleStartWorkflow = async (workflowId: string) => {
        setStarting(workflowId);
        try {
            const res = await apiClient.post("/requests/", {
                workflow_id: workflowId,
                request_data: { amount: 2500, department: "Engineering" } // Demo data
            });
            router.push(`/requests/${res.data.id}`);
        } catch (err) {
            console.error("Failed to start workflow", err);
        } finally {
            setStarting(null);
        }
    };

    const isAdmin = user?.roles?.some((r: any) => r.name === "Admin");

    if (loading) return (
        <DashboardLayout>
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <div className="space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
                    <div>
                        <div className="flex items-center space-x-2 mb-3">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Operational Blueprints</span>
                        </div>
                        <h1 className="text-5xl font-black text-white mb-3 tracking-tighter uppercase italic">Workflow Inventory</h1>
                        <p className="text-slate-400 text-lg font-medium max-w-xl">Manage and orchestrate enterprise-grade logic templates across your infrastructure.</p>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => router.push('/admin/workflows/create')}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-5 rounded-2xl font-black tracking-widest uppercase text-xs shadow-2xl transition-all hover:-translate-y-1 flex items-center group"
                        >
                            <Plus className="w-4 h-4 mr-3 group-hover:rotate-90 transition-transform duration-500" />
                            Build New Strategy
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {workflows.length === 0 ? (
                        <Card className="col-span-full py-32 flex flex-col items-center justify-center glass-dark border-dashed border-white/10">
                            <div className="p-6 rounded-3xl bg-slate-900 border border-white/5 mb-6 animate-pulse shadow-2xl">
                                <Info className="w-12 h-12 text-slate-700" />
                            </div>
                            <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">No operational architectures deployed.</p>
                        </Card>
                    ) : (
                        workflows.map((wf: any) => (
                            <Card key={wf.id} className="group glass-dark border border-white/5 hover:border-indigo-500/50 transition-all duration-500 flex flex-col h-full shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                                <CardHeader className="flex flex-row items-start justify-between p-8">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/20 transition-all duration-500 border border-indigo-500/20">
                                        <Play className="w-6 h-6 fill-indigo-400/20 group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div className="px-3 py-1.5 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
                                        <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Protocol v4.1</span>
                                    </div>
                                </CardHeader>

                                <CardContent className="flex-1 flex flex-col p-8 pt-0">
                                    <h3 className="text-2xl font-black text-white mb-3 tracking-tight uppercase italic">{wf.name}</h3>
                                    <p className="text-slate-400 text-sm font-medium line-clamp-3 mb-8 leading-relaxed">
                                        {wf.description || "System-defined orchestration template for automated cross-departmental processing."}
                                    </p>

                                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
                                        <div className="flex items-center text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black">
                                            <span className="text-indigo-400 mr-2">{wf.steps?.length || 0}</span>
                                            Strategic Nodes
                                        </div>
                                        <button
                                            onClick={() => handleStartWorkflow(wf.id)}
                                            disabled={!!starting}
                                            className="px-6 py-3 rounded-xl bg-indigo-500 text-white text-xs font-black tracking-widest uppercase hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 flex items-center"
                                        >
                                            {starting === wf.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2 fill-current" />}
                                            Deploy
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
