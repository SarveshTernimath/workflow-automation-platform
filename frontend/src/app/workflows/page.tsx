"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Plus, Play, Info, Loader2, Cpu } from "lucide-react";
import apiClient from "@/lib/api";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface Role {
    id: string;
    name: string;
}

interface WorkflowStep {
    id?: string;
    name: string;
    step_order?: number;
}

interface Workflow {
    id: string;
    name: string;
    description?: string;
    steps?: WorkflowStep[];
}

interface User {
    roles?: Role[];
}

export default function WorkflowsPage() {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState<string | null>(null);
    const [payload, setPayload] = useState<string>("");
    const [requestTitle, setRequestTitle] = useState("");
    const [requestPriority, setRequestPriority] = useState("medium");
    const [showPayloadModal, setShowPayloadModal] = useState<Workflow | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [blueprintJson, setBlueprintJson] = useState<string>("");
    const [roles, setRoles] = useState<Role[]>([]);
    const [user, setUser] = useState<User | null>(null);

    // Wizard State
    const [newStepName, setNewStepName] = useState("");
    const [newStepRole, setNewStepRole] = useState("");
    const [newStepSLA, setNewStepSLA] = useState(24);

    const router = useRouter();

    useEffect(() => {
        async function fetchData() {
            try {
                const [wfRes, userRes, rolesRes] = await Promise.all([
                    apiClient.get("workflows/"),
                    apiClient.get("users/me"),
                    apiClient.get("roles/")
                ]);
                setWorkflows(wfRes.data);
                setUser(userRes.data);
                setRoles(rolesRes.data);

                // Set default blueprint
                const defaultBlueprint = {
                    name: "NEW_PROTOCOL_" + Math.floor(Math.random() * 10000),
                    description: "Enterprise-grade orchestration logic.",
                    steps: [
                        { name: "Initiation", role: "user", order: 1, sla: 24 },
                        { name: "Verification", role: "manager", order: 2, sla: 24 },
                        { name: "Final Authorization", role: "admin", order: 3, sla: 24 }
                    ]
                };
                setBlueprintJson(JSON.stringify(defaultBlueprint, null, 2));
            } catch (err) {
                console.error("Failed to fetch data", err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const handleCreateWorkflow = async () => {
        setIsSubmitting(true);
        try {
            const data = JSON.parse(blueprintJson);

            // Map role names to IDs
            const formattedSteps = data.steps.map((s: { name: string; description?: string; order: number; sla?: number; role: string }) => {
                const role = roles.find(r => r.name.toLowerCase() === s.role.toLowerCase());
                return {
                    name: s.name,
                    description: s.description || "",
                    step_order: s.order,
                    sla_hours: s.sla || 24,
                    required_role_id: role ? role.id : null,
                    is_conditional: false
                };
            });

            // Auto-generate linear transitions
            const transitions = [];
            for (let i = 0; i < formattedSteps.length; i++) {
                const current = formattedSteps[i];
                const next = formattedSteps[i + 1];
                transitions.push({
                    from_step_order: current.step_order,
                    to_step_order: next ? next.step_order : null,
                    outcome: "APPROVED"
                });
            }

            await apiClient.post("/workflows/", {
                name: data.name,
                description: data.description,
                is_active: true,
                steps: formattedSteps,
                transitions: transitions
            });

            // Refresh list
            const wfRes = await apiClient.get("/workflows/");
            setWorkflows(wfRes.data);
            setShowCreateModal(false);
        } catch (err) {
            console.error("Failed to create workflow", err);
            alert("Failed to create workflow. Verify JSON structure and role names.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddStep = () => {
        if (!newStepName || !newStepRole) {
            alert("Please provide a Step Name and Role.");
            return;
        }
        try {
            const current = JSON.parse(blueprintJson);
            const nextOrder = (current.steps?.length || 0) + 1;

            const newStep = {
                name: newStepName,
                role: newStepRole,
                order: nextOrder,
                sla: Number(newStepSLA)
            };

            const updated = {
                ...current,
                steps: [...(current.steps || []), newStep]
            };

            setBlueprintJson(JSON.stringify(updated, null, 2));

            // Reset inputs
            setNewStepName("");
            setNewStepRole(roles[0]?.name || "");
            setNewStepSLA(24);
        } catch {
            alert("Invalid JSON in editor. Please fix before adding steps.");
        }
    };


    const handleStartWorkflow = async () => {
        if (!showPayloadModal) return;
        if (!requestTitle.trim()) {
            alert("Please provide a request title.");
            return;
        }
        setStarting(showPayloadModal.id);
        try {
            const parsedPayload = {
                title: requestTitle,
                description: payload,
                priority: requestPriority
            };

            const res = await apiClient.post("/requests/", {
                workflow_id: showPayloadModal.id,
                request_data: parsedPayload
            });
            router.push(`/instances/${res.data.id}`);
        } catch (err) {
            console.error("Failed to start workflow", err);
        } finally {
            setStarting(null);
            setShowPayloadModal(null);
            setRequestTitle("");
            setPayload("");
            setRequestPriority("medium");
        }
    };

    const isAdmin = user?.roles?.some((r) => r.name.toLowerCase() === "admin");

    if (loading) return (
        <DashboardLayout>
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <div className="space-y-12 pb-20">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
                    <div>
                        <div className="flex items-center space-x-2 mb-3">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Operational Blueprints</span>
                        </div>
                        <h1 className="text-5xl font-black text-white mb-3 tracking-tighter uppercase italic">Workflow Inventory</h1>
                        <p className="text-slate-400 text-lg font-medium max-w-xl leading-relaxed">Manage and orchestrate enterprise-grade logic templates across your infrastructure.</p>
                    </div>
                    {isAdmin && (
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-white/5 hover:bg-white/10 text-slate-400 px-8 py-5 rounded-2xl font-black tracking-widest uppercase text-xs border border-white/5 transition-all flex items-center group"
                            >
                                <Plus className="w-4 h-4 mr-3 group-hover:rotate-90 transition-transform duration-500" />
                                Start New Workflow
                            </button>
                            <button
                                onClick={() => router.push('/admin/workflows/create')}
                                className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-5 rounded-2xl font-black tracking-widest uppercase text-xs shadow-2xl transition-all hover:-translate-y-1 flex items-center group"
                            >
                                <Cpu className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform" />
                                Build Strategy
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {workflows.length === 0 ? (
                        <Card className="col-span-full py-32 flex flex-col items-center justify-center glass-dark border-dashed border-white/10 rounded-[3rem]">
                            <div className="p-6 rounded-3xl bg-slate-900 border border-white/5 mb-6 animate-pulse shadow-2xl">
                                <Info className="w-12 h-12 text-slate-700" />
                            </div>
                            <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">No operational architectures deployed.</p>
                        </Card>
                    ) : (
                        workflows.map((wf) => (
                            <Card key={wf.id} className="group glass-dark border border-white/5 hover:border-indigo-500/50 transition-all duration-500 flex flex-col h-full shadow-2xl relative overflow-hidden rounded-[2.5rem]">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                                <CardHeader className="flex flex-row items-start justify-between p-10">
                                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/20 transition-all duration-500 border border-indigo-500/20">
                                        <Play className="w-7 h-7 fill-indigo-400/20 group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div className="px-3 py-1.5 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
                                        <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Protocol v4.1</span>
                                    </div>
                                </CardHeader>

                                <CardContent className="flex-1 flex flex-col p-10 pt-0">
                                    <h3 className="text-3xl font-black text-white mb-4 tracking-tight uppercase italic">{wf.name}</h3>
                                    <p className="text-slate-400 font-medium line-clamp-3 mb-10 leading-relaxed text-sm opacity-80">
                                        {wf.description || "System-defined orchestration template for automated cross-departmental processing."}
                                    </p>

                                    <div className="flex items-center justify-between mt-auto pt-8 border-t border-white/5">
                                        <div className="flex items-center text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black">
                                            <span className="text-indigo-400 mr-2">{wf.steps?.length || 0}</span>
                                            Strategic Nodes
                                        </div>
                                        <button
                                            onClick={() => {
                                                setShowPayloadModal(wf);
                                                setPayload("");
                                            }}
                                            className="px-8 py-4 rounded-xl bg-indigo-500 text-white text-[10px] font-black tracking-widest uppercase hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 flex items-center hover:scale-105 active:scale-95"
                                        >
                                            New Request
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Create Workflow Modal */}
                <AnimatePresence>
                    {showCreateModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => !isSubmitting && setShowCreateModal(false)}
                                className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="w-full max-w-3xl glass-dark border border-white/10 rounded-[3rem] p-12 relative overflow-hidden shadow-2xl flex flex-col"
                            >
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full -z-10" />

                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                                            <Plus className="w-6 h-6 text-indigo-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Define Operational Blueprint</h2>
                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">JSON Source Interface</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Available Roles</span>
                                        <div className="flex gap-2">
                                            {roles.map(r => (
                                                <div key={r.id} className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[6px] font-bold text-indigo-400 uppercase tracking-tighter">
                                                    {r.name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10 overflow-hidden">
                                    <div className="flex flex-col h-[400px]">
                                        {/* Wizard Inputs */}
                                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 mb-4">
                                            <label htmlFor="step-name" className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 block">Add Evaluation Node</label>
                                            <div className="grid grid-cols-12 gap-2">
                                                <div className="col-span-5">
                                                    <input
                                                        id="step-name"
                                                        name="step_name"
                                                        aria-label="Step Name"
                                                        type="text"
                                                        placeholder="Step Name"
                                                        value={newStepName}
                                                        onChange={e => setNewStepName(e.target.value)}
                                                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                                                    />
                                                </div>
                                                <div className="col-span-4">
                                                    <select
                                                        id="step-role"
                                                        name="step_role"
                                                        aria-label="Select Role"
                                                        value={newStepRole}
                                                        onChange={e => setNewStepRole(e.target.value)}
                                                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                                                    >
                                                        <option value="">Select Role...</option>
                                                        {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="col-span-2">
                                                    <input
                                                        id="step-sla"
                                                        name="step_sla"
                                                        aria-label="SLA Hours"
                                                        type="number"
                                                        placeholder="SLA"
                                                        value={newStepSLA}
                                                        onChange={e => setNewStepSLA(Number(e.target.value))}
                                                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                                                    />
                                                </div>
                                                <div className="col-span-1">
                                                    <button
                                                        onClick={handleAddStep}
                                                        className="w-full h-full bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg flex items-center justify-center transition-colors"
                                                        aria-label="Add Step"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <label htmlFor="blueprint-json" className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 block">Blueprint Definition (JSON)</label>
                                        <textarea
                                            id="blueprint-json"
                                            name="blueprint_json"
                                            value={blueprintJson}
                                            onChange={(e) => setBlueprintJson(e.target.value)}
                                            className="flex-1 bg-slate-900/50 border border-white/5 rounded-2xl p-6 text-indigo-400 font-mono text-xs focus:outline-none focus:border-indigo-500/40 transition-all leading-relaxed resize-none overflow-y-auto"
                                            spellCheck={false}
                                        />
                                    </div>

                                    <div className="flex flex-col h-[400px] bg-white/5 rounded-2xl border border-white/5 p-8">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 block">Interface Logic</label>
                                        <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                                            {/* ... content remains same ... */}
                                            <div className="space-y-2">
                                                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-wider italic">Role-Based Tiers</h4>
                                                <p className="text-[9px] text-slate-400 leading-relaxed font-medium">Use the <code className="text-indigo-400 text-[10px] font-mono">role</code> key to assign authority. The system will auto-map to standard system nodes.</p>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-wider italic">Sequence Order</h4>
                                                <p className="text-[9px] text-slate-400 leading-relaxed font-medium">Define execution priority with <code className="text-indigo-400 text-[10px] font-mono">order</code>. Transitions are synthesized automatically in linear mode.</p>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-wider italic">Validation</h4>
                                                <p className="text-[9px] text-slate-400 leading-relaxed font-medium">System strictly enforces JSON schema. Ensure all brackets are balanced before committing.</p>
                                            </div>
                                            <div className="mt-8 pt-6 border-t border-white/5">
                                                <div className="flex items-center space-x-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                                    <Info className="w-3 h-3 text-indigo-500" />
                                                    <span>Pro Tip</span>
                                                </div>
                                                <p className="text-[8px] text-slate-500 mt-2 leading-relaxed italic">&quot;Defining blueprints here bypasses the wizard. Use this for rapid deployment of complex logic.&quot;</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        disabled={isSubmitting}
                                        className="flex-1 px-8 py-5 rounded-2xl bg-white/5 text-slate-400 font-black uppercase tracking-widest text-[10px] border border-white/5 hover:bg-white/10 transition-all"
                                    >
                                        Discard
                                    </button>
                                    <button
                                        onClick={handleCreateWorkflow}
                                        disabled={isSubmitting}
                                        className="flex-[2] px-8 py-5 rounded-2xl bg-indigo-500 text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-indigo-500/20 flex items-center justify-center hover:bg-indigo-600 transition-all"
                                    >
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Commit Blueprint</span>}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Payload Configuration Modal */}
                <AnimatePresence>
                    {showPayloadModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => !starting && setShowPayloadModal(null)}
                                className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="w-full max-w-2xl glass-dark border border-white/10 rounded-[3rem] p-12 relative overflow-hidden shadow-2xl"
                            >
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full -z-10" />

                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                                        <Cpu className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Initialize Sequence</h2>
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{showPayloadModal.name}</p>
                                    </div>
                                </div>

                                <div className="space-y-6 mb-10">
                                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                                        <div>
                                            <label htmlFor="req-title" className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Request Title *</label>
                                            <input
                                                id="req-title"
                                                name="req_title"
                                                type="text"
                                                value={requestTitle}
                                                onChange={(e) => setRequestTitle(e.target.value)}
                                                className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500/40 transition-all"
                                                placeholder="e.g., Budget Approval for Q1 Marketing"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="req-desc" className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Description</label>
                                            <textarea
                                                id="req-desc"
                                                name="req_desc"
                                                value={payload}
                                                onChange={(e) => setPayload(e.target.value)}
                                                className="w-full bg-slate-900/50 border border-white/5 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-indigo-500/40 transition-all min-h-[120px] leading-relaxed"
                                                placeholder="Provide additional details about your request..."
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="req-priority" className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Priority</label>
                                            <select
                                                id="req-priority"
                                                name="req_priority"
                                                value={requestPriority}
                                                onChange={(e) => setRequestPriority(e.target.value)}
                                                className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500/40 transition-all"
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setShowPayloadModal(null)}
                                        disabled={starting !== null}
                                        className="flex-1 px-8 py-5 rounded-2xl bg-white/5 text-slate-400 font-black uppercase tracking-widest text-[10px] border border-white/5 hover:bg-white/10 transition-all"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        onClick={handleStartWorkflow}
                                        disabled={starting !== null}
                                        className="flex-[2] px-8 py-5 rounded-2xl bg-indigo-500 text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-indigo-500/20 flex items-center justify-center hover:bg-indigo-600 transition-all"
                                    >
                                        {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Start Request</span>}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
}
