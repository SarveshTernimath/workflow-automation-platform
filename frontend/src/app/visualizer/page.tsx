"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, RotateCcw, XCircle, Layers, Loader2, Workflow, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "@/lib/api";
import PremiumWorkflowFlowchart from "@/components/workflow/PremiumWorkflowFlowchart";

// --- Types ---
interface FlowNode {
    id: string;
    name: string;
    type: "WORKFLOW" | "REQUEST" | "STEP";
    status?: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED" | "FAILED";
    color: string;
    desc?: string;
    x?: number;
    y?: number;
}

interface GraphData {
    nodes: FlowNode[];
    links: { source: string; target: string; active?: boolean }[];
}

export default function VisualizerPage() {
    const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const [data, setData] = useState<GraphData>({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);

    // Fetch Data Logic (Ported from Graph Component to Page)
    useEffect(() => {
        async function fetchData() {
            try {
                const [workflowsRes, requestsRes] = await Promise.all([
                    apiClient.get("workflows/"),
                    apiClient.get("requests/")
                ]);

                const workflows = workflowsRes.data;
                const requests = requestsRes.data;

                const nodes: FlowNode[] = [];
                const links: { source: string; target: string; active?: boolean }[] = [];

                // 1. Workflows
                workflows.forEach((wf: any, idx: number) => {
                    nodes.push({
                        id: `wf-${wf.id}`,
                        name: wf.name,
                        type: "WORKFLOW",
                        color: "#6366f1",
                        desc: wf.description || "Core Operational Protocol",
                        status: "APPROVED" // Implicit
                    });
                });

                // 2. Requests
                requests.forEach((req: any) => {
                    if (filterStatus && req.status !== filterStatus) return; // Filter logic

                    nodes.push({
                        id: `req-${req.id}`,
                        name: `REQ-${req.id.substr(0, 4)}`,
                        type: "REQUEST",
                        status: req.status,
                        color: req.status === "COMPLETED" ? "#10b981" : "#f59e0b",
                        desc: `Instance initiated by ${req.user_id}`
                    });

                    if (req.workflow_id) {
                        links.push({
                            source: `wf-${req.workflow_id}`,
                            target: `req-${req.id}`,
                            active: req.status !== "COMPLETED"
                        });
                    }
                });

                setData({ nodes, links });
            } catch (err) {
                console.error("Failed to fetch visualizer data", err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
        const interval = setInterval(fetchData, 5000); // Live poll
        return () => clearInterval(interval);
    }, [filterStatus]);

    const handleReset = () => {
        setFilterStatus(null);
        setSelectedNode(null);
    };

    return (
        <DashboardLayout>
            <div className="relative h-[calc(100vh-140px)] w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#050505] group">

                {/* 2D Premium Flowchart */}
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                        <span className="ml-3 text-xs font-bold text-indigo-400 uppercase tracking-widest">Constructing Matrix...</span>
                    </div>
                ) : (
                    <PremiumWorkflowFlowchart
                        data={data}
                        onNodeClick={(node) => setSelectedNode(node)}
                    />
                )}

                {/* HUD: Top Controls */}
                <div className="absolute top-6 left-6 z-20 flex gap-2">
                    <div className="glass-panel p-1 rounded-lg flex gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFilterStatus(null)}
                            className={`text-xs h-7 px-3 ${!filterStatus ? 'bg-white/10 text-white' : 'text-text-secondary'}`}
                        >
                            All
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFilterStatus("PENDING")}
                            className={`text-xs h-7 px-3 ${filterStatus === 'PENDING' ? 'bg-accent-warning/20 text-accent-warning' : 'text-text-secondary'}`}
                        >
                            Pending
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFilterStatus("FAILED")}
                            className={`text-xs h-7 px-3 ${filterStatus === 'FAILED' ? 'bg-accent-error/20 text-accent-error' : 'text-text-secondary'}`}
                        >
                            Failed
                        </Button>
                    </div>

                    <Button variant="outline" size="sm" onClick={handleReset} className="h-9 w-9 p-0 rounded-lg glass-panel border-white/10 hover:bg-white/10">
                        <RotateCcw className="w-4 h-4 text-text-secondary" />
                    </Button>
                </div>

                {/* HUD: Node Details Side Panel */}
                <AnimatePresence>
                    {selectedNode && (
                        <motion.div
                            initial={{ x: 300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 300, opacity: 0 }}
                            className="absolute top-6 right-6 bottom-6 w-96 glass-panel z-30 rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-white/10"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-white/10 relative overflow-hidden bg-black/20">
                                <div className={`absolute top-0 left-0 w-1 h-full ${selectedNode.color ? '' : 'bg-white'}`} style={{ backgroundColor: selectedNode.color }} />
                                <div className="absolute top-0 right-0 p-4">
                                    <button onClick={() => setSelectedNode(null)} className="text-text-tertiary hover:text-white transition-colors">
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 border border-white/5 text-text-secondary uppercase tracking-wider">{selectedNode.type}</span>
                                </div>
                                <h2 className="text-2xl font-bold text-white tracking-tight">{selectedNode.name}</h2>
                                <p className="text-xs font-mono text-indigo-400 mt-1 opacity-80">{selectedNode.id}</p>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-8 flex-1 overflow-y-auto">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest flex items-center gap-2">
                                        <Workflow className="w-3 h-3" /> Description
                                    </label>
                                    <p className="text-sm text-text-secondary leading-relaxed bg-surface rounded-xl p-4 border border-white/5">
                                        {selectedNode.desc || "No additional metadata available for this node."}
                                    </p>
                                </div>

                                {selectedNode.status && (
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest flex items-center gap-2">
                                            <Activity className="w-3 h-3" /> Status
                                        </label>
                                        <div className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-white/5">
                                            <span className={`w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] ${selectedNode.status === 'COMPLETED' ? 'bg-emerald-500 text-emerald-500' :
                                                selectedNode.status === 'FAILED' ? 'bg-rose-500 text-rose-500' : 'bg-amber-500 text-amber-500'
                                                }`} />
                                            <span className="text-sm font-bold text-white">{selectedNode.status}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="p-6 border-t border-white/10 bg-black/40">
                                <Button className="w-full bg-white text-black hover:bg-gray-200 font-bold shadow-lg shadow-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]">
                                    Full Inspection
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
}
