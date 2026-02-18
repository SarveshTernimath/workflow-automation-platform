"use client";

import React, { useEffect, useState, use } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import {
    CheckCircle2,
    Clock,
    ArrowLeft,
    Send,
    XCircle,
    Activity,
    Shield,
    Loader2,
    FileJson,
    Cpu,
    Calendar,
    AlertCircle
} from "lucide-react";
import apiClient from "@/lib/api";
import { format } from "date-fns";
import Link from "next/link";

interface Step {
    step_order: number;
    step_name: string;
    status: string;
    completed_at?: string;
    deadline?: string;
    outcome?: string;
}

interface RequestDetail {
    id: string;
    status: string;
    created_at: string;
    steps: Step[];
    workflow_id: string;
    requester_id: string;
    request_data: Record<string, unknown>;
}

export default function RequestExecutionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [request, setRequest] = useState<RequestDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [outcome, setOutcome] = useState("APPROVED");
    const [note, setNote] = useState("");

    useEffect(() => {
        async function fetchRequest() {
            try {
                const res = await apiClient.get(`/requests/${id}`);
                setRequest(res.data);
            } catch (err) {
                console.error("Failed to fetch request", err);
            } finally {
                setLoading(false);
            }
        }
        fetchRequest();
    }, [id]);

    const handleProcess = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            await apiClient.post(`/requests/${id}/process`, {
                outcome,
                context: { note }
            });
            const res = await apiClient.get(`/requests/${id}`);
            setRequest(res.data);
            setNote("");
        } catch (err) {
            console.error("Processing failed", err);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return (
        <DashboardLayout>
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
                <Loader2 className="w-10 h-10 text-accent-primary animate-spin" />
                <p className="text-text-secondary text-sm font-medium animate-pulse">Retrieving Trace Data...</p>
            </div>
        </DashboardLayout>
    );

    if (!request) return (
        <DashboardLayout>
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <div className="p-4 rounded-full bg-surface border border-dashed border-border">
                    <AlertCircle className="w-8 h-8 text-text-tertiary" />
                </div>
                <p className="text-text-secondary font-medium">Request trace not found or access terminated.</p>
                <Link href="/dashboard" className="text-accent-primary hover:text-accent-primary-hover text-sm font-medium transition-colors">
                    Return to Dashboard
                </Link>
            </div>
        </DashboardLayout>
    );

    const currentStep = request.steps.find((s) => s.status === 'PENDING');
    const sortedSteps = [...request.steps].sort((a, b) => (a.step_order || 0) - (b.step_order || 0));

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard"
                            className="p-2.5 rounded-lg bg-surface hover:bg-surface-hover border border-border text-text-secondary hover:text-text-primary transition-all group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-2xl font-bold text-text-primary">Request Audit</h1>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${request.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                    request.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                        'bg-accent-primary/10 text-accent-primary border-accent-primary/20'
                                    }`}>
                                    {request.status}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-text-secondary font-mono">
                                <span className="flex items-center gap-1.5">
                                    <Shield className="w-3.5 h-3.5" />
                                    ID: {request.id.slice(0, 8)}...
                                </span>
                                <span className="w-1 h-1 rounded-full bg-border" />
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {format(new Date(request.created_at), "MMM d, yyyy 'at' HH:mm")}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Timeline */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="glass-panel border-border bg-black/40">
                            <CardHeader className="px-6 py-5 border-b border-border flex flex-row items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Activity className="w-5 h-5 text-accent-secondary" />
                                    <CardTitle className="text-lg font-semibold text-text-primary">Execution Trace</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-8 relative before:absolute before:inset-y-0 before:left-[19px] before:w-px before:bg-border">
                                    {sortedSteps.map((step, idx) => {
                                        const isCompleted = step.status === 'APPROVED' || step.status === 'REJECTED';
                                        const isPending = step.status === 'PENDING';

                                        return (
                                            <div key={idx} className="relative pl-12 group">
                                                {/* Timeline Node */}
                                                <div className={`absolute left-0 top-1 w-10 h-10 rounded-xl border flex items-center justify-center z-10 transition-all duration-300 ${isCompleted ? 'bg-surface border-emerald-500/50 text-emerald-500 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]' :
                                                    isPending ? 'bg-surface border-accent-secondary text-accent-secondary shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)] scale-110' :
                                                        'bg-surface border-border text-text-tertiary'
                                                    }`}>
                                                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> :
                                                        isPending ? <Clock className="w-5 h-5 animate-pulse" /> :
                                                            <div className="w-2.5 h-2.5 rounded-full bg-text-tertiary" />}
                                                </div>

                                                {/* Content Card */}
                                                <div className={`rounded-xl border p-5 transition-all duration-300 ${isPending ? 'bg-surface-active border-accent-secondary/30 shadow-lg' :
                                                    'bg-surface border-border hover:border-border-hover'
                                                    }`}>
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div>
                                                            <h3 className={`text-base font-bold mb-1 ${isPending ? 'text-white' : 'text-text-primary'}`}>
                                                                {step.step_name}
                                                            </h3>
                                                            <div className="flex flex-wrap gap-2">
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${step.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                                    step.status === 'REJECTED' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                                        isPending ? 'bg-accent-secondary/10 text-accent-secondary border-accent-secondary/20' :
                                                                            'bg-surface text-text-tertiary border-border'
                                                                    }`}>
                                                                    {step.status}
                                                                </span>
                                                                {step.completed_at && (
                                                                    <span className="text-[10px] text-text-secondary px-2 py-0.5 rounded bg-surface border border-border">
                                                                        {format(new Date(step.completed_at), 'MMM d, HH:mm')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {step.deadline && (
                                                            <div className="p-3 rounded-lg bg-black/20 border border-border">
                                                                <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mb-1">SLA Deadline</p>
                                                                <p className={`text-sm font-medium ${new Date(step.deadline) < new Date() ? 'text-red-400' : 'text-text-primary'}`}>
                                                                    {format(new Date(step.deadline), 'PP')}
                                                                </p>
                                                            </div>
                                                        )}
                                                        {step.outcome && (
                                                            <div className="p-3 rounded-lg bg-black/20 border border-border md:col-span-2">
                                                                <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mb-1">Decision Note</p>
                                                                <p className="text-sm text-text-primary italic">&quot;{step.outcome}&quot;</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {request.status === 'COMPLETED' && (
                                        <div className="relative pl-12 pt-4">
                                            <div className="absolute left-0 top-6 w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 flex items-center justify-center z-10 shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]">
                                                <Shield className="w-5 h-5" />
                                            </div>
                                            <div className="p-5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20">
                                                <h3 className="text-emerald-400 font-bold mb-1">Workflow Completed</h3>
                                                <p className="text-emerald-500/70 text-sm">All steps executed successfully. Chain of custody verified.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Console & Details */}
                    <div className="space-y-8">
                        {/* Decision Console */}
                        <Card className={`glass-panel border-border bg-black/40 overflow-hidden sticky top-6 transition-all duration-300 ${currentStep ? 'shadow-[0_0_30px_-10px_rgba(59,130,246,0.15)] border-accent-secondary/30' : ''
                            }`}>
                            <CardHeader className={`px-6 py-5 border-b ${currentStep ? 'bg-accent-secondary/5 border-accent-secondary/20' : 'border-border'}`}>
                                <CardTitle className="text-lg font-semibold text-text-primary flex items-center gap-2">
                                    <Cpu className={`w-5 h-5 ${currentStep ? 'text-accent-secondary animate-pulse' : 'text-text-tertiary'}`} />
                                    Decision Console
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                {currentStep ? (
                                    <form onSubmit={handleProcess} className="space-y-6">
                                        <div className="p-4 rounded-xl bg-surface border border-border">
                                            <p className="text-xs text-text-secondary font-bold uppercase tracking-wider mb-2">Active Step</p>
                                            <p className="text-lg font-bold text-white mb-2">{currentStep.step_name}</p>
                                            <div className="h-1 w-full bg-border rounded-full overflow-hidden">
                                                <div className="h-full bg-accent-secondary w-full animate-pulse" />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-xs text-text-primary font-bold uppercase tracking-wider ml-1">Action</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setOutcome("APPROVED")}
                                                    className={`py-3 px-4 rounded-lg border font-bold text-xs uppercase tracking-wider transition-all ${outcome === 'APPROVED'
                                                        ? 'bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-500/20'
                                                        : 'bg-surface text-text-secondary border-border hover:bg-surface-hover'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-center gap-2">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        Approve
                                                    </div>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setOutcome("REJECTED")}
                                                    className={`py-3 px-4 rounded-lg border font-bold text-xs uppercase tracking-wider transition-all ${outcome === 'REJECTED'
                                                        ? 'bg-red-500 text-white border-red-600 shadow-lg shadow-red-500/20'
                                                        : 'bg-surface text-text-secondary border-border hover:bg-surface-hover'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-center gap-2">
                                                        <XCircle className="w-4 h-4" />
                                                        Reject
                                                    </div>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label htmlFor="note" className="text-xs text-text-primary font-bold uppercase tracking-wider ml-1">
                                                Justification context
                                            </label>
                                            <textarea
                                                id="note"
                                                value={note}
                                                onChange={(e) => setNote(e.target.value)}
                                                className="w-full bg-surface border border-border rounded-xl p-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-secondary/50 focus:ring-1 focus:ring-accent-secondary/50 transition-all resize-y min-h-[120px]"
                                                placeholder="Add context or reasoning for this decision..."
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="w-full py-4 rounded-xl bg-accent-secondary hover:bg-accent-secondary-hover text-white font-bold text-sm uppercase tracking-widest shadow-lg shadow-accent-secondary/20 hover:shadow-accent-secondary/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                                        >
                                            {processing ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    Execute
                                                    <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </button>
                                    </form>
                                ) : (
                                    <div className="py-8 text-center space-y-4">
                                        <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto">
                                            <Shield className="w-8 h-8 text-text-tertiary" />
                                        </div>
                                        <div>
                                            <h4 className="text-text-primary font-bold">No Actions Required</h4>
                                            <p className="text-text-tertiary text-xs mt-1">Workflow is completed or waiting for upstream tasks.</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Instance Data */}
                        <Card className="glass-panel border-border bg-black/40">
                            <CardHeader className="px-6 py-5 border-b border-border">
                                <CardTitle className="text-lg font-semibold text-text-primary flex items-center gap-2">
                                    <FileJson className="w-5 h-5 text-text-secondary" />
                                    Payload Data
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-6 bg-black/50">
                                    <pre className="font-mono text-xs text-accent-secondary leading-relaxed">
                                        {JSON.stringify(request.request_data, null, 2)}
                                    </pre>
                                </div>
                                <div className="p-4 border-t border-border grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider mb-1">Requester</p>
                                        <p className="text-xs text-text-secondary font-mono truncate" title={request.requester_id}>
                                            {request.requester_id}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider mb-1">Workflow ID</p>
                                        <p className="text-xs text-text-secondary font-mono truncate" title={request.workflow_id}>
                                            {request.workflow_id}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
