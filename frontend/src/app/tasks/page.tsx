"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Clock, AlertCircle, CheckCircle2, Loader2, ArrowRight, GitBranch } from "lucide-react";
import apiClient from "@/lib/api";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

interface Task {
    request_id: string;
    request_step_id: string;
    workflow_name: string;
    step_name: string;
    step_description: string | null;
    deadline: string | null;
    is_sla_breached: boolean;
    request_data: any;
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
            <div className="space-y-12">
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
                    <Card className="py-32 flex flex-col items-center justify-center glass-dark border-dashed border-white/10 shadow-2xl rounded-[3rem]">
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
                                <Card className={`group glass-dark hover:border-indigo-500/50 transition-all duration-500 cursor-pointer overflow-hidden shadow-2xl ${task.is_sla_breached ? 'border-rose-500/30' : 'border-white/5'}`}
                                    onClick={() => router.push(`/instances/${task.request_id}`)}
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
                                                        "{task.step_description}"
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

                                            <div className="flex flex-col items-end gap-3">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/instances/${task.request_id}`);
                                                    }}
                                                    className="flex items-center justify-center space-x-4 px-10 py-5 rounded-2xl bg-indigo-500 text-white font-black tracking-widest uppercase text-xs shadow-2xl shadow-indigo-500/20 transition-all duration-300 hover:bg-indigo-600 hover:scale-105 active:scale-95 group-hover:shadow-indigo-500/40"
                                                >
                                                    <span>Acknowledge & Execute</span>
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
            </div>
        </DashboardLayout>
    );
}

