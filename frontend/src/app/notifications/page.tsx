"use client";

import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Bell, Shield, CheckCircle2, AlertTriangle, Info, Clock, Check } from "lucide-react";

export default function NotificationsPage() {
    const notifications = [
        {
            id: 1,
            title: "System Calibration Complete",
            desc: "Operational core synchronized with post-quantum encryption protocols.",
            time: "2m ago",
            type: "success",
            icon: CheckCircle2
        },
        {
            id: 2,
            title: "SLA Optimization Required",
            desc: "Instance #A92B3C is approaching critical timeline boundary.",
            time: "15m ago",
            type: "warning",
            icon: AlertTriangle
        },
        {
            id: 3,
            title: "Strategic Deployment Initialized",
            desc: "New workflow blueprint 'Cross-Dep Audit' active in production cluster 4.",
            time: "1h ago",
            type: "info",
            icon: Info
        },
        {
            id: 4,
            title: "Intrusion Deterrence Active",
            desc: "Security matrices successfully mitigated 12 unauthorized access attempts.",
            time: "4h ago",
            type: "security",
            icon: Shield
        },
    ];

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-accent-primary/10 border border-accent-primary/20">
                                <Bell className="w-5 h-5 text-accent-primary" />
                            </div>
                            <h1 className="text-2xl font-bold text-text-primary">Intelligence Center</h1>
                        </div>
                        <p className="text-text-secondary text-sm max-w-2xl">
                            Real-time alerts, system optimizations, and security telemetry streams.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="px-4 py-2 rounded-lg bg-surface hover:bg-surface-hover border border-border text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary transition-all flex items-center gap-2 group">
                            <Check className="w-4 h-4" />
                            Mark All Read
                        </button>
                    </div>
                </div>

                {/* Notifications Grid */}
                <div className="grid grid-cols-1 gap-4">
                    {notifications.map((alert) => (
                        <div
                            key={alert.id}
                            className="group relative overflow-hidden glass-panel border-border hover:border-accent-secondary/30 transition-all duration-300 rounded-xl p-6"
                        >
                            <div className="flex items-start gap-5 relative z-10">
                                {/* Icon Base */}
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${alert.type === 'warning' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                    alert.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                        alert.type === 'security' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                            'bg-accent-secondary/10 text-accent-secondary border-accent-secondary/20'
                                    }`}>
                                    <alert.icon className="w-6 h-6" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="text-lg font-bold text-text-primary truncate pr-4">
                                            {alert.title}
                                        </h3>
                                        <span className="flex items-center gap-1.5 text-xs font-mono text-text-tertiary shrink-0">
                                            <Clock className="w-3.5 h-3.5" />
                                            {alert.time}
                                        </span>
                                    </div>
                                    <p className="text-text-secondary text-sm leading-relaxed">
                                        {alert.desc}
                                    </p>
                                </div>
                            </div>

                            {/* Hover Gradient Effect */}
                            <div className={`absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br from-transparent to-white/5 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500 pointer-events-none rounded-full ${alert.type === 'warning' ? 'via-amber-500/5' :
                                alert.type === 'success' ? 'via-emerald-500/5' :
                                    alert.type === 'security' ? 'via-red-500/5' :
                                        'via-accent-secondary/5'
                                }`} />
                        </div>
                    ))}
                </div>

                {/* Empty State (Hidden if data exists) */}
                {notifications.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 rounded-full bg-surface border border-border flex items-center justify-center mb-6">
                            <Bell className="w-8 h-8 text-text-tertiary" />
                        </div>
                        <h3 className="text-lg font-bold text-text-primary">All Systems Nominal</h3>
                        <p className="text-text-secondary text-sm mt-2">No active alerts or notifications at this time.</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
