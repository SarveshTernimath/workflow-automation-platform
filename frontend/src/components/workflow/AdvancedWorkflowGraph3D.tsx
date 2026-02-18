/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import apiClient from "@/lib/api";
import { Loader2 } from "lucide-react";
import * as THREE from "three";

// Dynamically import specific ForceGraph to avoid SSR issues
const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), { ssr: false });

interface GraphNode {
    id: string;
    group: number;
    name: string;
    color: string;
    val: number; // Size
    status?: string;
    type: 'CORE' | 'WORKFLOW' | 'REQUEST';
    desc?: string;
    x?: number;
    y?: number;
    z?: number;
    [key: string]: any;
}

interface GraphLink {
    source: string | GraphNode;
    target: string | GraphNode;
    active: boolean; // Is data flowing?
}

interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}

interface AdvancedWorkflowGraph3DProps {
    onNodeClick?: (node: GraphNode) => void;
    filterStatus?: string | null;
}

export default function AdvancedWorkflowGraph3D({ onNodeClick, filterStatus }: AdvancedWorkflowGraph3DProps) {
    const [data, setData] = useState<GraphData>({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);
    const fgRef = useRef<any>(null);
    // Removed hoverNode state as it was unused and caused lint errors

    const fetchData = useCallback(async () => {
        try {
            const [workflowsRes, requestsRes] = await Promise.all([
                apiClient.get("workflows/"),
                apiClient.get("requests/")
            ]);

            const workflows = workflowsRes.data;
            const requests = requestsRes.data;

            const nodes: GraphNode[] = [];
            const links: GraphLink[] = [];

            // 1. Central Hub
            nodes.push({
                id: "NEXUS_CORE",
                group: 0,
                name: "NEXUS CORE",
                color: "#ffffff",
                val: 40,
                type: 'CORE',
                desc: "Central Orchestration Unit"
            });

            // 2. Workflow Hubs
            workflows.forEach((wf: any) => {
                nodes.push({
                    id: `wf-${wf.id}`,
                    group: 1,
                    name: wf.name,
                    color: "#ef4444",
                    val: 20,
                    type: 'WORKFLOW',
                    desc: wf.description || "Workflow Template"
                });

                links.push({
                    source: "NEXUS_CORE",
                    target: `wf-${wf.id}`,
                    active: true
                });
            });

            // 3. Request Nodes
            requests.forEach((req: any) => {
                // Apply Filter if exists
                if (filterStatus && req.status !== filterStatus) return;

                const statusColor = req.status === "COMPLETED" ? "#10b981" :
                    req.status === "PENDING" ? "#f59e0b" :
                        req.status === "FAILED" ? "#ef4444" : "#3b82f6";

                nodes.push({
                    id: `req-${req.id}`,
                    group: 2,
                    name: `REQ-${req.id.slice(0, 4)}`,
                    color: statusColor,
                    val: 10,
                    status: req.status,
                    type: 'REQUEST',
                    desc: req.title
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
            console.error("Failed to fetch graph data", err);
        } finally {
            setLoading(false);
        }
    }, [filterStatus]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const handleNodeClick = (node: GraphNode) => {
        if (onNodeClick) onNodeClick(node);

        // Fly to node
        if (fgRef.current && typeof node.x === 'number' && typeof node.y === 'number' && typeof node.z === 'number') {
            const distance = 40;
            const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
            fgRef.current.cameraPosition(
                { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
                node,
                3000
            );
        }
    };

    const handleNodeHover = (node: GraphNode | null) => {
        // Removed setHoverNode call
        if (document.body) {
            document.body.style.cursor = node ? 'pointer' : 'default';
        }
    };

    // Custom 3D Object Rendering based on Type
    const nodeThreeObject = (nodeInput: object) => {
        const n = nodeInput as GraphNode;
        if (n.type === 'CORE') {
            const geometry = new THREE.IcosahedronGeometry(10, 2);
            const material = new THREE.MeshLambertMaterial({
                color: n.color,
                transparent: true,
                opacity: 0.8,
                emissive: n.color,
                emissiveIntensity: 0.5,
                wireframe: true
            });
            return new THREE.Mesh(geometry, material);
        }
        else if (n.type === 'WORKFLOW') {
            const geometry = new THREE.SphereGeometry(6, 16, 16);
            const material = new THREE.MeshStandardMaterial({
                color: n.color,
                metalness: 0.5,
                roughness: 0.5,
                emissive: n.color,
                emissiveIntensity: 0.2
            });
            return new THREE.Mesh(geometry, material);
        }
        else {
            // Requests are Cubes
            const geometry = new THREE.BoxGeometry(4, 4, 4);
            const material = new THREE.MeshPhongMaterial({
                color: n.color,
                transparent: true,
                opacity: 0.9,
            });
            return new THREE.Mesh(geometry, material);
        }
    };

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-accent-primary animate-spin" />
                    <span className="text-sm font-medium text-text-secondary animate-pulse">Constructing Neural Matrix...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full relative bg-black">
            {/* Graph Container */}
            <ForceGraph3D
                ref={fgRef}
                graphData={data}
                nodeLabel="name"
                nodeColor="color"
                nodeVal="val"

                // Advanced Node Rendering
                nodeThreeObject={nodeThreeObject as any}
                nodeResolution={24}

                // Link styling
                linkWidth={0.5}
                linkColor={() => "#ffffff15"}
                linkDirectionalParticles={4}
                linkDirectionalParticleSpeed={(d: any) => d.active ? 0.005 : 0}
                linkDirectionalParticleWidth={2}
                linkDirectionalParticleColor={() => "#ef4444"}

                // Container
                backgroundColor="#000000"
                showNavInfo={false}

                // Interaction
                onNodeClick={handleNodeClick as any}
                onNodeHover={handleNodeHover as any}

                // Initial Camera
                controlType="orbit"
            />

            {/* Overlay Info */}
            <div className="absolute bottom-6 left-6 pointer-events-none p-4 glass-panel rounded-xl">
                <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-accent-success animate-pulse" />
                    <div>
                        <p className="text-xs font-bold text-white tracking-widest uppercase">Live Connection</p>
                        <p className="text-[10px] text-text-primary mt-0.5">{data.nodes.length} Active Nodes • {data.links.length} Vectors</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
