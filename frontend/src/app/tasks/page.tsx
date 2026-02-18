"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Clock, AlertCircle, CheckCircle2, Loader2, ArrowRight, GitBranch } from "lucide-react";
import Portal from "@/components/ui/Portal";
import apiClient from "@/lib/api";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

interface Step {
    id: string;
    step_order: number;
    step_name: string;
    status: string;
}

interface RequestDetail {
    steps: Step[];
    [key: string]: unknown; // Allow other props for now to be safe, or specify more if known
}

interface Task {
    request_id: string;
    request_step_id: string;
    workflow_name: string;
    step_name: string;
    step_description: string | null;
    deadline: string | null;
    is_sla_breached: boolean;
    request_data: Record<string, unknown>;
    created_at: string;
}

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function fetchTasks() {
            try {
                const res = await apiClient.get("requests/my-tasks");
                setTasks(res.data);
            } catch (err) {
                console.error("Failed to fetch tasks", err);
            } finally {
                setLoading(false);
            }
        }
        fetchTasks();
    }, []);

    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [requestDetails, setRequestDetails] = useState<RequestDetail | null>(null);
    const [comment, setComment] = useState("");
    const [processing, setProcessing] = useState(false);

    // Fetch full details when a task is selected
    useEffect(() => {
        if (selectedTask) {
            apiClient.get(`requests/${selectedTask.request_id}`)
                .then(res => setRequestDetails(res.data))
                .catch(err => console.error("Failed to load details", err));
        }
    }, [selectedTask]);

    const handleDecision = async (action: "approve" | "reject") => {
        if (!selectedTask) return;
        setProcessing(true);
        try {
            await apiClient.post(`/workflow-instances/${selectedTask.request_id}/decision`, {
                action,
                comment
            });

            // Success - remove from list
            setTasks(prev => prev.filter(t => t.request_step_id !== selectedTask.request_step_id));
            setSelectedTask(null);
            setRequestDetails(null);
            setComment("");
        } catch (err) {
            console.error("Decision failed", err);
            alert("Execution failed. Please verify your permissions.");
        } finally {
            setProcessing(false);
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
            <div className="space-y-12 pb-20">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
                    <div>
                        <div className="flex items-center space-x-2 mb-3">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Action Buffer</span>
                        </div>
                        <h1 className="text-5xl font-black text-white mb-3 tracking-tighter uppercase italic">Strategic Tasks</h1>
                        <p className="text-slate-400 text-lg font-medium max-w-xl">Workflow nodes requiring high-privileged decision and operational action.</p>
                    </div>
                </div>

                {tasks.length === 0 ? (
                    <Card className="py-32 flex flex-col items-center justify-center glass-panel border-dashed border-white/10 shadow-2xl rounded-[3rem]">
                        <div className="p-8 rounded-3xl bg-slate-900 border border-white/5 mb-8 animate-pulse shadow-2xl">
                            <CheckCircle2 className="w-16 h-16 text-emerald-500/50" />
                        </div>
                        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] mb-8">Strategic queue clear. All operational nodes stable.</p>

                        <button
                            onClick={() => router.push('/workflows')}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black tracking-widest uppercase text-xs shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center group"
                        >
                            <GitBranch className="w-4 h-4 mr-3" />
                            Initialize New Strategy
                        </button>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {tasks.map((task, index) => (
                            <motion.div
                                key={task.request_step_id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1, duration: 0.5 }}
                            >
                                <Card className={`group glass-panel hover:border-indigo-500/50 transition-all duration-500 cursor-pointer overflow-hidden shadow-2xl ${task.is_sla_breached ? 'border-rose-500/30' : 'border-white/10'}`}
                                    onClick={() => setSelectedTask(task)}
                                >
                                    <CardContent className="p-10 relative">
                                        {task.is_sla_breached && (
                                            <div className="absolute top-0 right-0 px-6 py-2 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-bl-2xl shadow-xl shadow-rose-500/20">
                                                SLA Incident Level 1
                                            </div>
                                        )}
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-6 mb-6">
                                                    <div className={`p-5 rounded-2xl shadow-inner ${task.is_sla_breached ? 'bg-rose-500/10 border border-rose-500/20' : 'bg-indigo-500/10 border border-indigo-500/20'}`}>
                                                        {task.is_sla_breached ? (
                                                            <AlertCircle className="w-8 h-8 text-rose-500" />
                                                        ) : (
                                                            <GitBranch className="w-8 h-8 text-indigo-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-1 opacity-50">
                                                            {task.workflow_name}
                                                        </p>
                                                        <h3 className="text-3xl font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight italic">
                                                            {task.step_name}
                                                        </h3>
                                                    </div>
                                                </div>

                                                {task.step_description && (
                                                    <p className="text-slate-400 mb-8 leading-relaxed max-w-3xl font-medium text-lg italic opacity-80">
                                                        &quot;{task.step_description}&quot;
                                                    </p>
                                                )}

                                                <div className="flex flex-wrap items-center gap-8 text-[10px] font-black uppercase tracking-widest">
                                                    <div className="flex items-center gap-2 text-slate-500">
                                                        <Clock className="w-4 h-4 text-indigo-400" />
                                                        <span>
                                                            Deadline: {task.deadline
                                                                ? formatDistanceToNow(new Date(task.deadline), { addSuffix: true })
                                                                : "UNRESTRICTED"}
                                                        </span>
                                                    </div>
                                                    <div className="text-slate-600">
                                                        Initialized {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-3 relative z-30">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setSelectedTask(task);
                                                    }}
                                                    className="flex items-center justify-center space-x-4 px-10 py-5 rounded-2xl bg-indigo-500 text-white font-black tracking-widest uppercase text-xs shadow-2xl shadow-indigo-500/20 transition-all duration-300 hover:bg-indigo-600 hover:scale-105 active:scale-95 group-hover:shadow-indigo-500/40 cursor-pointer"
                                                >
                                                    <span>Review Request</span>
                                                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
                                                </button>
                                                <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Advances protocol state for your assigned role
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Execution Modal */}
                <div style={{ display: selectedTask ? 'block' : 'none' }}>
                    {selectedTask && (
                        <Portal>
                            <div className="fixed inset-0 flex items-center justify-center p-6 z-[9999]">
                                {/* Backdrop */}
                                <div
                                    className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                                    onClick={() => setSelectedTask(null)}
                                />

                                {/* Modal Content */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="w-full max-w-4xl glass-panel border border-white/10 rounded-[3rem] p-12 relative overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                                >
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full -z-10" />

                                    <div className="flex items-start justify-between mb-8">
                                        <div>
                                            <div className="flex items-center space-x-2 mb-2">
                                                <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Execution Protocol</span>
                                            </div>
                                            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">{selectedTask.workflow_name}</h2>
                                            <p className="text-xl text-slate-400 mt-1">{selectedTask.step_name}</p>
                                        </div>
                                        <button
                                            onClick={() => setSelectedTask(null)}
                                            className="p-4 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 transition-colors"
                                        >
                                            <span className="sr-only">Close</span>
                                            X
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-8 overflow-y-auto custom-scrollbar flex-1">
                                        <div className="space-y-8">
                                            <div className="bg-white/5 border border-white/5 p-6 rounded-3xl">
                                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Description</h3>
                                                <p className="text-slate-300 leading-relaxed font-medium">
                                                    {selectedTask.step_description || "No description provided for this operational node."}
                                                </p>
                                            </div>

                                            <div>
                                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Request Context</h3>
                                                <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 font-mono text-xs text-indigo-400 overflow-x-auto">
                                                    {/* Filter out sensitive keys if needed, for now just hiding raw JSON if explicitly requested, but request_data might be needed. User said "NEVER show JSON payload". I will render key-values cleanly. */}
                                                    {selectedTask.request_data ? (
                                                        <div className="space-y-2">
                                                            {Object.entries(selectedTask.request_data).map(([key, value]) => (
                                                                <div key={key} className="flex justify-between border-b border-white/5 pb-1">
                                                                    <span className="text-slate-500 uppercase">{key}:</span>
                                                                    <span className="text-white">{String(value)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : <span className="text-slate-600">No context data available.</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col h-full">
                                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Timeline</h3>
                                            <div className="flex-1 bg-white/5 border border-white/5 rounded-3xl p-6 relative overflow-y-auto">
                                                {!requestDetails ? (
                                                    <div className="flex items-center justify-center h-full">
                                                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                                                    </div>
                                                ) : (
                                                    <div className="space-y-6 relative">
                                                        {/* Vertical Line */}
                                                        <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-white/10" />

                                                        {requestDetails.steps?.sort((a, b) => (a.step_order || 0) - (b.step_order || 0)).map((step, idx) => {
                                                            const isCompleted = step.status === "COMPLETED" || step.status === "APPROVED";
                                                            const isCurrent = step.status === "PENDING" || step.status === "IN_PROGRESS";
                                                            return (
                                                                <div key={step.id} className="relative pl-8">
                                                                    <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 ${isCompleted ? 'bg-emerald-500 border-emerald-500' : isCurrent ? 'bg-indigo-500 border-indigo-500 animate-pulse' : 'bg-slate-900 border-slate-700'}`} />
                                                                    <p className={`text-sm font-bold ${isCurrent ? 'text-indigo-400' : isCompleted ? 'text-emerald-400' : 'text-slate-600'}`}>
                                                                        {step.step_name || `Step ${idx + 1}`}
                                                                    </p>
                                                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{step.status}</p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="task-comment" className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Executive Commentary</label>
                                            <textarea
                                                id="task-comment"
                                                name="task_comment"
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                                className="w-full bg-slate-900/80 border border-white/10 rounded-2xl p-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors h-24 resize-none"
                                                placeholder="Provide strategic context for your decision..."
                                            />
                                        </div>

                                        <div className="flex gap-4 pt-4">
                                            <div className="flex gap-4 pt-4">
                                                <button
                                                    onClick={() => handleDecision("reject")}
                                                    disabled={processing}
                                                    className="flex-1 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
                                                >
                                                    REJECT
                                                </button>
                                                <button
                                                    onClick={() => handleDecision("approve")}
                                                    disabled={processing}
                                                    className="flex-[2] bg-emerald-500 hover:bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center group hover:scale-[1.02]"
                                                >
                                                    {processing ? (
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <span>APPROVE REQUEST</span>
                                                            <ArrowRight className="w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform" />
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                </motion.div>
                            </div>
                        </Portal>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

