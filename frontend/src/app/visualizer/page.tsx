"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, RotateCcw, XCircle, Layers } from "lucide-react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";

// Dynamic import for the heavy 3D component
const AdvancedGraph = dynamic(() => import("@/components/workflow/AdvancedWorkflowGraph3D"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full min-h-[600px] flex items-center justify-center bg-black">
            <div className="text-accent-primary animate-pulse">Initializing 3D Engine...</div>
        </div>
    )
});

interface VisualizerNode {
    id: string;
    name: string;
    type: string;
    color: string;
    status?: string;
    desc?: string;
}

export default function VisualizerPage() {
    const [selectedNode, setSelectedNode] = useState<VisualizerNode | null>(null);
    const [filterStatus, setFilterStatus] = useState<string | null>(null);

    const handleReset = () => {
        setFilterStatus(null);
        setSelectedNode(null);
    };

    return (
        <DashboardLayout>
            <div className="relative h-[calc(100vh-140px)] w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black group">

                {/* 3D Visualizer Canvas */}
                <div className="absolute inset-0 z-0">
                    <AdvancedGraph
                        onNodeClick={setSelectedNode}
                        filterStatus={filterStatus}
                    />
                </div>

                {/* HUD: Top Controls */}
                <div className="absolute top-6 left-6 z-10 flex gap-2">
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
                            className="absolute top-6 right-6 bottom-6 w-80 glass-panel border-l border-white/10 bg-black/80 backdrop-blur-xl z-20 rounded-xl overflow-hidden flex flex-col shadow-2xl"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-white/10 relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-1 h-full ${selectedNode.color ? '' : 'bg-white'}`} style={{ backgroundColor: selectedNode.color }} />
                                <div className="absolute top-0 right-0 p-4">
                                    <button onClick={() => setSelectedNode(null)} className="text-text-tertiary hover:text-white transition-colors">
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                </div>
                                <h2 className="text-xl font-bold text-white tracking-wide mt-2">{selectedNode.name}</h2>
                                <p className="text-xs font-mono text-accent-primary mt-1 opacity-80">{selectedNode.id}</p>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Type</label>
                                    <div className="flex items-center gap-2 text-sm text-white font-medium">
                                        {selectedNode.type === 'WORKFLOW' ? <Layers className="w-4 h-4 text-accent-primary" /> :
                                            selectedNode.type === 'REQUEST' ? <CheckCircle2 className="w-4 h-4 text-accent-secondary" /> :
                                                <Layers className="w-4 h-4" />}
                                        {selectedNode.type}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Details</label>
                                    <p className="text-sm text-text-primary leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
                                        {selectedNode.desc || "No additional metadata available for this node."}
                                    </p>
                                </div>

                                {selectedNode.status && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Status</label>
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${selectedNode.status === 'COMPLETED' ? 'bg-accent-success' :
                                                selectedNode.status === 'FAILED' ? 'bg-accent-error' : 'bg-accent-warning'
                                                }`} />
                                            <span className="text-sm text-white">{selectedNode.status}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="p-4 border-t border-white/10 bg-white/5">
                                <Button className="w-full bg-white text-black hover:bg-gray-200">
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
