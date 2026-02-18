/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import apiClient from "@/lib/api";
import { Loader2 } from "lucide-react";

// Dynamically import specific ForceGraph to avoid SSR issues
const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), { ssr: false });

interface GraphNode {
    id: string;
    group: number;
    name: string;
    color: string;
    val: number; // Size
    status?: string;
}

interface GraphLink {
    source: string | any;
    target: string | any;
    active: boolean; // Is data flowing?
}

interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}

export default function WorkflowGraph3D() {
    const [data, setData] = useState<GraphData>({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);
    const fgRef = useRef<any>(null);

    useEffect(() => {
        async function fetchLiveMetrics() {
            try {
                // Fetch both workflows and 'live' requests
                // In a real live system we might poll this or use websockets
                const [workflowsRes, requestsRes] = await Promise.all([
                    apiClient.get("workflows/"),
                    apiClient.get("requests/")
                ]);

                const workflows = workflowsRes.data;
                const requests = requestsRes.data;

                const nodes: GraphNode[] = [];
                const links: GraphLink[] = [];

                // 1. Create Central Hub
                nodes.push({
                    id: "NEXUS_CORE",
                    group: 0,
                    name: "NEXUS CORE",
                    color: "#ffffff",
                    val: 20
                });

                // 2. Create Workflow Hubs (Group 1)
                workflows.forEach((wf: any) => {
                    nodes.push({
                        id: `wf-${wf.id}`,
                        group: 1,
                        name: wf.name,
                        color: "#ef4444", // Red Accent
                        val: 10
                    });

                    // Link to Core
                    links.push({
                        source: "NEXUS_CORE",
                        target: `wf-${wf.id}`,
                        active: true
                    });
                });

                // 3. Create Request Nodes (Group 2)
                requests.forEach((req: any) => {
                    const statusColor = req.status === "COMPLETED" ? "#10b981" :
                        req.status === "PENDING" ? "#f59e0b" : "#3b82f6";

                    nodes.push({
                        id: `req-${req.id}`,
                        group: 2,
                        name: `REQ-${req.id.substr(0, 4)}`,
                        color: statusColor,
                        val: 5,
                        status: req.status
                    });

                    // Link Request to its Workflow
                    if (req.workflow_id) {
                        links.push({
                            source: `wf-${req.workflow_id}`,
                            target: `req-${req.id}`,
                            active: req.status !== "COMPLETED" // Active flow if not done
                        });
                    }
                });

                setData({ nodes, links });
            } catch (err) {
                console.error("Failed to fetch graph data", err);
            } finally {
                setLoading(false);
            }
        }

        fetchLiveMetrics();
        // Poll every 5 seconds for "live" feel
        const interval = setInterval(fetchLiveMetrics, 5000);
        return () => clearInterval(interval);
    }, []);



    if (loading) {
        return (
            <div className="w-full h-[600px] flex items-center justify-center bg-black/20 backdrop-blur rounded-xl border border-white/10">
                <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
                <span className="ml-3 text-xs uppercase tracking-widest text-white">Initializing 3D Matrix...</span>
            </div>
        );
    }

    return (
        <div className="w-full h-[600px] relative rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-black">
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Live Orchestration Map</h3>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">Real-time force-directed topology</p>
            </div>

            <ForceGraph3D
                ref={fgRef}
                graphData={data}
                nodeLabel="name"
                nodeColor="color"
                nodeVal="val"
                // Link styling
                linkWidth={0.5}
                linkColor={() => "#ffffff33"} // Translucent white links
                linkDirectionalParticles={4} // Particles flowing!
                linkDirectionalParticleSpeed={(d: any) => d.active ? 0.005 : 0} // Only active links have flow
                linkDirectionalParticleWidth={2}
                linkDirectionalParticleColor={() => "#ef4444"} // Red data packets
                // Container
                backgroundColor="#000000"
                showNavInfo={false}

                // Interaction
                onNodeClick={(node: any) => {
                    // Focus on node
                    if (fgRef.current) {
                        const distance = 40;
                        const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
                        fgRef.current.cameraPosition(
                            { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
                            node,
                            3000
                        );
                    }
                }}
            />
        </div>
    );
}
