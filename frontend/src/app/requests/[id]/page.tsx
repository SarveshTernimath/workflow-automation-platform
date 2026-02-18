"use client";

import React, { useEffect, useState, use } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { CheckCircle2, Clock, AlertCircle, ArrowLeft, Send, XCircle, Activity, Zap, Shield, Loader2 } from "lucide-react";
import apiClient from "@/lib/api";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RequestExecutionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [request, setRequest] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [outcome, setOutcome] = useState("APPROVED");
    const [note, setNote] = useState("");
    const router = useRouter();

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
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-8">
                <div className="relative">
                    <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                    <div className="absolute inset-0 blur-xl bg-indigo-500/20 rounded-full animate-pulse" />
                </div>
                <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px] animate-pulse">Accessing Instance Memory</p>
            </div>
        </DashboardLayout>
    );

    if (!request) return <DashboardLayout><div className="text-center py-20 text-slate-500 uppercase font-black tracking-widest text-xs">Request sequence terminated or not found.</div></DashboardLayout>;

    const currentStep = request.steps.find((s: any) => s.status === 'PENDING');

    return (
        <DashboardLayout>
            <div className="space-y-12">
                <div className="flex items-center space-x-4">
                    <Link href="/dashboard" className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all group">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <div className="h-px w-8 bg-white/10" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Operational Tracker</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
                    <div>
                        <div className="flex items-center space-x-3 mb-3">
                            <div className={`w-2 h-2 rounded-full ${request.status === 'COMPLETED' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' :
                                request.status === 'REJECTED' ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' :
                                    'bg-indigo-500 shadow-[0_0_8px_#6366f1] animate-pulse'}`} />
                            <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${request.status === 'COMPLETED' ? 'text-emerald-400' :
                                request.status === 'REJECTED' ? 'text-rose-400' : 'text-indigo-400'}`}>
                                Protocol {request.status}
                            </span>
                        </div>
                        <h1 className="text-5xl font-black text-white mb-3 tracking-tighter uppercase italic">Instance <span className="text-indigo-500 font-mono tracking-normal not-italic ml-2">#{request.id.slice(0, 8).toUpperCase()}</span></h1>
                        <p className="text-slate-400 text-lg font-medium opacity-80 uppercase tracking-widest text-xs">Initialized {format(new Date(request.created_at), 'PPPp')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-12">
                        <Card className="glass-dark border border-white/5 shadow-2xl overflow-hidden">
                            <CardHeader className="p-8 border-b border-white/5 bg-white/2">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 rounded-lg bg-indigo-500/10">
                                        <Activity className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <CardTitle className="text-lg font-black tracking-widest uppercase italic">Execution Timeline</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-10">
                                <div className="relative pl-12 space-y-16">
                                    <div className="absolute left-[23px] top-2 bottom-2 w-px bg-white/5" />

                                    {request.steps.sort((a: any, b: any) => (a.step_order || 0) - (b.step_order || 0)).map((step: any, idx: number) => {
                                        const isCompleted = step.status === 'APPROVED' || step.status === 'REJECTED';
                                        const isPending = step.status === 'PENDING';

                                        return (
                                            <div key={idx} className="relative group">
                                                <div className={`absolute left-[-38px] top-0 w-[50px] h-[50px] rounded-2xl flex items-center justify-center border-4 border-[#0a0a0c] z-10 transition-all duration-500 ${isCompleted ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' :
                                                    isPending ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-110' :
                                                        'bg-slate-800'
                                                    }`}>
                                                    {isCompleted ? <CheckCircle2 className="w-5 h-5 text-white" /> :
                                                        isPending ? <Clock className="w-5 h-5 text-white animate-pulse" /> :
                                                            <div className="w-2 h-2 rounded-full bg-slate-600" />}
                                                </div>

                                                <div className="flex flex-col">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className={`text-xl font-black italic uppercase tracking-tight ${isPending ? 'text-white' : 'text-slate-500'}`}>
                                                            {step.step_name}
                                                        </h4>
                                                        {step.completed_at && (
                                                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest opacity-60">Verified {format(new Date(step.completed_at), 'p')}</span>
                                                        )}
                                                    </div>

                                                    <div className={`p-8 rounded-[2rem] border transition-all duration-500 ${isPending ? 'bg-indigo-500/5 border-indigo-500/20 shadow-xl' : 'bg-white/2 border-white/5 opacity-60'
                                                        }`}>
                                                        <div className="grid grid-cols-2 gap-8">
                                                            <div>
                                                                <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest mb-1">State Vector</p>
                                                                <p className={`text-xs font-bold uppercase tracking-widest ${isCompleted && step.status === 'APPROVED' ? 'text-emerald-400' :
                                                                    isCompleted && step.status === 'REJECTED' ? 'text-rose-400' :
                                                                        isPending ? 'text-indigo-400' : 'text-slate-500'
                                                                    }`}>
                                                                    {step.status}
                                                                </p>
                                                            </div>
                                                            {step.deadline && (
                                                                <div className="text-right">
                                                                    <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest mb-1">Expiration</p>
                                                                    <p className={`text-xs font-bold uppercase tracking-widest ${new Date(step.deadline) < new Date() ? 'text-rose-400' : 'text-slate-400'}`}>
                                                                        {format(new Date(step.deadline), 'PP')}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {step.outcome && (
                                                            <div className="mt-6 pt-6 border-t border-white/5">
                                                                <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest mb-2">Decision Notes</p>
                                                                <p className="text-xs text-slate-400 font-medium italic">"{step.outcome}"</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {request.status === 'COMPLETED' && (
                                        <div className="relative pt-8">
                                            <div className="absolute left-[-38px] top-8 w-[50px] h-[50px] rounded-full bg-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center justify-center border-4 border-[#0a0a0c] z-10">
                                                <Zap className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="p-8 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center space-x-6 animate-premium">
                                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                                                    <Shield className="w-6 h-6 text-emerald-400" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-black text-emerald-400 uppercase italic tracking-tighter">Chain Optimization Completed</h4>
                                                    <p className="text-[10px] text-emerald-500/60 font-black uppercase tracking-widest">All strategic nodes validated successfully.</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-12">
                        <Card className="glass-dark border border-indigo-500/20 shadow-2xl overflow-hidden shadow-indigo-500/5">
                            <CardHeader className="p-8 border-b border-indigo-500/10 bg-indigo-500/5">
                                <CardTitle className="flex items-center text-lg font-black tracking-widest uppercase italic">
                                    <Clock className="w-5 h-5 mr-3 text-indigo-400" />
                                    Decision Console
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8">
                                {currentStep ? (
                                    <form onSubmit={handleProcess} className="space-y-8">
                                        <div className="flex flex-col gap-4">
                                            <div className="p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 shadow-inner">
                                                <p className="text-[8px] text-indigo-400/60 font-black uppercase tracking-[0.3em] mb-2">Active Strategic Node</p>
                                                <p className="text-lg text-white font-black uppercase italic tracking-tight">{currentStep.step_name}</p>
                                            </div>

                                            {currentStep.deadline && (
                                                <div className={`p-6 rounded-2xl border ${new Date(currentStep.deadline) < new Date() ? 'bg-rose-500/10 border-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20'} shadow-inner`}>
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className={`text-[8px] font-black uppercase tracking-[0.3em] mb-1 ${new Date(currentStep.deadline) < new Date() ? 'text-rose-400' : 'text-emerald-400'}`}>SLA Protection</p>
                                                            <p className="text-sm font-black text-white italic truncate">
                                                                {new Date(currentStep.deadline) < new Date() ? 'CRITICAL: BREACH DETECTED' : 'NOMINAL: MONITORING ACTIVE'}
                                                            </p>
                                                        </div>
                                                        <Clock className={`w-6 h-6 ${new Date(currentStep.deadline) < new Date() ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                type="button"
                                                onClick={() => setOutcome("APPROVED")}
                                                className={`py-5 rounded-[1.5rem] flex items-center justify-center border transition-all duration-500 font-extrabold uppercase tracking-widest text-[10px] ${outcome === 'APPROVED' ? 'bg-emerald-500 text-white border-emerald-500 shadow-xl shadow-emerald-500/20' : 'bg-slate-900 border-white/5 text-slate-500 hover:text-white'}`}
                                            >
                                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                                Approve
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setOutcome("REJECTED")}
                                                className={`py-5 rounded-[1.5rem] flex items-center justify-center border transition-all duration-500 font-extrabold uppercase tracking-widest text-[10px] ${outcome === 'REJECTED' ? 'bg-rose-500 text-white border-rose-500 shadow-xl shadow-rose-500/20' : 'bg-slate-900 border-white/5 text-slate-500 hover:text-white'}`}
                                            >
                                                <XCircle className="w-4 h-4 mr-2" />
                                                Reject
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            <label htmlFor="execution-note" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Strategic Justification</label>
                                            <textarea
                                                id="execution-note"
                                                name="execution_note"
                                                value={note}
                                                onChange={(e) => setNote(e.target.value)}
                                                className="w-full bg-slate-900 border border-white/5 rounded-2xl p-6 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-700 min-h-[160px] font-medium text-sm leading-relaxed"
                                                placeholder="Provide the operational context for this decision..."
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-black py-5 rounded-2xl shadow-2xl shadow-indigo-500/20 flex items-center justify-center group uppercase tracking-[0.3em] text-[10px] transition-all duration-500 mb-4"
                                        >
                                            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                                <>
                                                    Submit Decision
                                                    <Send className="w-4 h-4 ml-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                                </>
                                            )}
                                        </button>
                                        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest text-center">
                                            This action advances the operational step assigned to your identity clearance.
                                        </p>
                                    </form>
                                ) : (
                                    <div className="text-center py-12 px-6">
                                        <div className={`w-20 h-20 rounded-[2rem] mx-auto flex items-center justify-center mb-6 shadow-2xl ${request.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-900 text-slate-700 border border-white/5'}`}>
                                            <Shield className="w-10 h-10" />
                                        </div>
                                        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Security Lock: Sequence finalized or action privilege restricted.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="glass-dark border border-white/5 shadow-2xl overflow-hidden mt-8">
                            <CardHeader className="p-8 border-b border-white/5 bg-white/2">
                                <CardTitle className="text-lg font-black tracking-widest uppercase italic">Instance Intel</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-10">
                                <div>
                                    <p className="text-[8px] text-slate-600 font-black uppercase tracking-[0.3em] mb-2">Primary Payload</p>
                                    <pre className="text-[11px] bg-slate-900/50 p-6 rounded-[2rem] overflow-x-auto text-indigo-400 font-mono shadow-inner border border-white/5 leading-relaxed">
                                        {JSON.stringify(request.request_data, null, 2)}
                                    </pre>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-white/2 border border-white/5">
                                        <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest mb-1">Source Matrix</p>
                                        <p className="text-[10px] text-slate-400 font-bold truncate">{request.requester_id}</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/2 border border-white/5">
                                        <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest mb-1">Core Blueprint</p>
                                        <p className="text-[10px] text-slate-400 font-bold truncate">{request.workflow_id}</p>
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

