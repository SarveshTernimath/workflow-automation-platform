"use client";

import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
    return (
        <DashboardLayout>
            <div className="space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
                    <div>
                        <div className="flex items-center space-x-2 mb-3">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Signal Stream</span>
                        </div>
                        <h1 className="text-5xl font-black text-white mb-3 tracking-tighter uppercase italic">Intelligence Center</h1>
                        <p className="text-slate-400 text-lg font-medium max-w-xl">Real-time alerts, system optimizations, and security telemetry streams.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {[
                        { title: "System Calibration Complete", desc: "Operational core synchronized with post-quantum encryption protocols.", time: "2m ago", type: "success" },
                        { title: "SLA Optimization Required", desc: "Instance #A92B3C is approaching critical timeline boundary.", time: "15m ago", type: "warning" },
                        { title: "Strategic Deployment Initialized", desc: "New workflow blueprint 'Cross-Dep Audit' active in production cluster 4.", time: "1h ago", type: "info" },
                        { title: "Intrusion Deterrence Active", desc: "Security matrices successfully mitigated 12 unauthorized access attempts.", time: "4h ago", type: "security" },
                    ].map((alert, i) => (
                        <div key={i} className="group relative overflow-hidden glass-dark border border-white/5 p-8 rounded-[2rem] hover:border-indigo-500/30 transition-all duration-500 shadow-xl">
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center space-x-6">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner ${alert.type === 'warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                        alert.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                            alert.type === 'security' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                                'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                        }`}>
                                        <Bell className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-1">{alert.title}</h3>
                                        <p className="text-slate-400 text-sm font-medium italic opacity-70 group-hover:opacity-100 transition-opacity">&quot;{alert.desc}&quot;</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{alert.time}</span>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[60px] rounded-full -z-10 group-hover:bg-indigo-500/10 transition-colors" />
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}

