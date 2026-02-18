/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock, AlertTriangle, XCircle, ArrowRight, Layers, Shield, Cpu, Activity } from "lucide-react";

// --- Types ---
interface FlowNode {
    id: string;
    name: string;
    type: "WORKFLOW" | "REQUEST" | "STEP";
    status?: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED" | "FAILED";
    role?: string;
    color?: string;
    x?: number;
    y?: number;
    description?: string;
}

interface FlowLink {
    source: string;
    target: string;
    active?: boolean;
}

interface GraphData {
    nodes: FlowNode[];
    links: FlowLink[];
}

interface PremiumWorkflowFlowchartProps {
    data: GraphData; // Expecting pre-processed data or raw
    onNodeClick?: (node: FlowNode) => void;
}

// --- Icons Helper ---
const StatusIcon = ({ status }: { status?: string }) => {
    switch (status) {
        case "COMPLETED": return <Check className="w-3 h-3 text-emerald-400" />;
        case "APPROVED": return <Check className="w-3 h-3 text-emerald-400" />;
        case "REJECTED": return <XCircle className="w-3 h-3 text-rose-400" />;
        case "FAILED": return <AlertTriangle className="w-3 h-3 text-rose-400" />;
        case "PENDING": return <Clock className="w-3 h-3 text-amber-400 animate-pulse" />;
        default: return <Activity className="w-3 h-3 text-blue-400" />;
    }
};

const NodeIcon = ({ type }: { type: string }) => {
    switch (type) {
        case "WORKFLOW": return <Cpu className="w-4 h-4 text-indigo-400" />;
        case "REQUEST": return <Layers className="w-4 h-4 text-emerald-400" />;
        case "STEP": return <Shield className="w-4 h-4 text-amber-400" />;
        default: return <Activity className="w-4 h-4 text-slate-400" />;
    }
};

// --- Component ---
export default function PremiumWorkflowFlowchart({ data, onNodeClick }: PremiumWorkflowFlowchartProps) {
    // Layout Logic (Simple DAG Layout for standard "Step 1 -> Step 2 -> Step 3" flow)
    // For more complex flows, we might need a library like 'dagre', but for now we'll do a simple semantic column layout
    // Group 1: Workflows (Left)
    // Group 2: Requests (Flowing right)
    // Group 3: Steps (Vertical or detailed view)

    // Let's assume a strictly "Workflow Definition" view for polish
    // Or a "Live Instance" view.
    // Given the data structure from `AdvancedWorkflowGraph3D`, it mixes Workflows and Requests.
    // We will organize them: Workflows as generic "Lanes", Requests as items flowing through them?
    // Actually, user wants a "Flow Chart". Let's build a nice tree layout.

    const layout = useMemo(() => {
        const nodesWithPos = data.nodes.map((node, i) => {
            // Simple force-simulation-like or grid layout replacement
            // Let's create a Grid Layout based on 'group' or type
            let x = 0;
            let y = 0;

            if (node.type === 'WORKFLOW') {
                x = 100;
                y = 100 + (i * 150);
            } else if (node.type === 'REQUEST') {
                x = 400 + (i % 3) * 200; // Staggered
                y = 100 + (Math.floor(i / 3) * 150);
            } else {
                x = 800;
                y = 100 + (i * 100);
            }
            return { ...node, x, y };
        });

        return nodesWithPos;
    }, [data]);

    return (
        <div className="w-full h-full min-h-[600px] relative overflow-hidden bg-[#050505]">
            {/* Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

            {/* SVG Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <defs>
                    <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.1" />
                        <stop offset="50%" stopColor="#6366f1" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
                    </linearGradient>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" fillOpacity="0.5" />
                    </marker>
                </defs>
                {data.links.map((link, i) => {
                    const src = layout.find(n => n.id === link.source);
                    const tgt = layout.find(n => n.id === link.target);
                    if (!src || !tgt) return null;

                    return (
                        <g key={i}>
                            {/* Base Line */}
                            <motion.path
                                d={`M ${src.x! + 100} ${src.y! + 32} C ${src.x! + 200} ${src.y! + 32}, ${tgt.x! - 100} ${tgt.y! + 32}, ${tgt.x!} ${tgt.y! + 32}`}
                                stroke="url(#gradient-line)"
                                strokeWidth="2"
                                fill="none"
                                markerEnd="url(#arrowhead)"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 1, delay: i * 0.1 }}
                            />
                            {/* Animated Particle */}
                            {link.active !== false && (
                                <motion.circle r="3" fill="#6366f1">
                                    <animateMotion
                                        dur="2s"
                                        repeatCount="indefinite"
                                        path={`M ${src.x! + 100} ${src.y! + 32} C ${src.x! + 200} ${src.y! + 32}, ${tgt.x! - 100} ${tgt.y! + 32}, ${tgt.x!} ${tgt.y! + 32}`}
                                    />
                                </motion.circle>
                            )}
                        </g>
                    );
                })}
            </svg>

            {/* Nodes */}
            <div className="absolute inset-0 z-10">
                {layout.map((node) => (
                    <motion.div
                        key={node.id}
                        className="absolute w-64 p-0"
                        style={{ left: node.x, top: node.y }}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        onClick={() => onNodeClick?.(node)}
                    >
                        {/* Diamond Crystal Node */}
                        <div className="relative group cursor-pointer">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-xl opacity-20 group-hover:opacity-60 blur transition duration-500" />
                            <div className="relative glass-panel bg-[#0a0a0a]/90 rounded-xl border border-white/10 p-4 hover:border-indigo-500/50 transition-all duration-300">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg bg-surface border border-white/5 ${node.type === 'WORKFLOW' ? 'text-indigo-400' : 'text-emerald-400'}`}>
                                            <NodeIcon type={node.type} />
                                        </div>
                                        <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">{node.type}</span>
                                    </div>
                                    {node.status && (
                                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full bg-surface border border-white/5`}>
                                            <StatusIcon status={node.status} />
                                            <span className="text-[10px] font-medium text-text-secondary">{node.status}</span>
                                        </div>
                                    )}
                                </div>
                                <h4 className="text-sm font-bold text-white mb-1 truncate">{node.name}</h4>
                                <p className="text-[10px] text-text-secondary line-clamp-2 leading-relaxed">
                                    {node.description || `Operational node for ${node.name}`}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
