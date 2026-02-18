"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Plus, GitBranch, Trash2, Loader2, Calendar, Layers } from "lucide-react";
import apiClient from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface Workflow {
    id: string;
    name: string;
    description: string;
    steps: Record<string, unknown>[];
    is_active: boolean;
    created_at: string;
}

export default function WorkflowsListPage() {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(true);

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
                <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                    <Loader2 className="w-10 h-10 text-accent-primary animate-spin" />
                    <p className="text-sm font-bold text-text-secondary animate-pulse uppercase tracking-wider">Loading Protocols...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-[1600px] mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                <GitBranch className="w-5 h-5 text-indigo-400" />
                            </div>
                            <h1 className="text-2xl font-bold text-text-primary">Workflow Protocols</h1>
                        </div>
                        <p className="text-text-secondary text-sm max-w-2xl">
                            Define and manage the operational logic matrices for the platform.
                        </p>
                    </div>
                    <div>
                        <Link href="/admin/workflows/create">
                            <Button className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
                                <Plus className="w-4 h-4 mr-2" />
                                Create New Protocol
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 gap-4">
                    {workflows.length === 0 ? (
                        <Card className="py-24 flex flex-col items-center justify-center glass-panel border-dashed">
                            <div className="p-6 rounded-3xl bg-surface border border-border mb-6">
                                <GitBranch className="w-12 h-12 text-text-tertiary" />
                            </div>
                            <h3 className="text-lg font-bold text-text-primary">No protocols defined</h3>
                            <p className="text-text-secondary text-sm mt-2">Initialize a new workflow to get started.</p>
                        </Card>
                    ) : (
                        workflows.map((wf) => (
                            <div
                                key={wf.id}
                                className="group glass-panel hover:border-indigo-500/30 transition-all duration-300 rounded-xl p-6 relative overflow-hidden"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                                    <div className="flex items-start gap-5">
                                        <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center shrink-0 group-hover:border-indigo-500/30 transition-colors">
                                            <GitBranch className="w-6 h-6 text-indigo-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-text-primary mb-1 group-hover:text-indigo-400 transition-colors">
                                                {wf.name}
                                            </h3>
                                            <p className="text-text-secondary text-sm max-w-2xl leading-relaxed">
                                                {wf.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 md:border-l md:border-border md:pl-6">
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                                            <div className="flex items-center gap-2 text-text-secondary">
                                                <Layers className="w-4 h-4 text-text-tertiary" />
                                                <span className="text-xs font-medium">
                                                    <strong className="text-text-primary">{wf.steps?.length || 0}</strong> Nodes
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-text-secondary">
                                                <Calendar className="w-4 h-4 text-text-tertiary" />
                                                <span className="text-xs font-medium">
                                                    {formatDistanceToNow(new Date(wf.created_at))} ago
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(wf.id)}
                                                className="text-text-secondary hover:text-rose-400 hover:bg-rose-500/10"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
