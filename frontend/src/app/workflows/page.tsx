"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Plus, Info, Loader2, Cpu, GitBranch, ArrowRight, Shield } from "lucide-react";
import apiClient from "@/lib/api";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { animations } from "@/lib/animations";
import { WorkflowDiagram } from "@/components/workflow/WorkflowDiagram";

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
                <Loader2 className="w-10 h-10 text-accent-primary animate-spin" />
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <motion.div
                variants={animations.staggerContainer}
                initial="hidden"
                animate="show"
                className="space-y-8 pb-20"
            >
                {/* Header */}
                <motion.div variants={animations.fadeInUp} className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
                    <div>
                        <div className="flex items-center space-x-2 mb-2">
                            <span className="w-2 h-2 bg-accent-primary rounded-full animate-pulse" />
                            <span className="text-xs font-bold text-accent-primary tracking-widest uppercase">Operational Blueprints</span>
                        </div>
                        <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Workflow Inventory</h1>
                        <p className="text-text-secondary max-w-xl">Manage and orchestrate enterprise-grade logic templates across your infrastructure.</p>
                    </div>
                    {isAdmin && (
                        <div className="flex gap-3">
                            <Button
                                variant="secondary"
                                onClick={() => setShowCreateModal(true)}
                                className="h-12"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Start New Workflow
                            </Button>
                            <Button
                                onClick={() => router.push('/admin/workflows/create')}
                                className="h-12"
                            >
                                <Cpu className="w-4 h-4 mr-2" />
                                Build Strategy
                            </Button>
                        </div>
                    )}
                </motion.div>

                {/* Workflow Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workflows.length === 0 ? (
                        <Card className="col-span-full py-24 flex flex-col items-center justify-center border-dashed border-border">
                            <div className="p-4 rounded-full bg-surface-elevated border border-border mb-4">
                                <Info className="w-8 h-8 text-text-tertiary" />
                            </div>
                            <p className="text-text-secondary font-medium">No operational architectures deployed.</p>
                        </Card>
                    ) : (
                        workflows.map((wf) => (
                            <motion.div variants={animations.fadeInUp} key={wf.id}>
                                <Card className="group hover:border-accent-primary/50 flex flex-col h-full overflow-hidden relative">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent-primary/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                                        <div className="w-10 h-10 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-accent-secondary group-hover:text-accent-primary transition-colors">
                                            <GitBranch className="w-5 h-5" />
                                        </div>
                                        <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                                            v4.1
                                        </Badge>
                                    </CardHeader>

                                    <CardContent className="flex-1 flex flex-col">
                                        <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{wf.name}</h3>
                                        <p className="text-text-secondary text-sm line-clamp-2 mb-6 h-10">
                                            {wf.description || "System-defined orchestration template."}
                                        </p>

                                        <div className="mt-auto space-y-4">
                                            <div className="flex items-center justify-between text-xs text-text-tertiary">
                                                <div className="flex items-center space-x-2">
                                                    <Shield className="w-3 h-3" />
                                                    <span>{wf.steps?.length || 0} Critical Nodes</span>
                                                </div>
                                            </div>

                                            <Button
                                                className="w-full justify-between group/btn"
                                                onClick={() => {
                                                    setShowPayloadModal(wf);
                                                    setPayload("");
                                                }}
                                            >
                                                Initialize
                                                <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Create Workflow Modal */}
                <AnimatePresence>
                    {showCreateModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="w-full max-w-4xl glass-panel rounded-xl flex flex-col max-h-[90vh]"
                            >
                                <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-transparent z-10 rounded-t-xl">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-lg bg-accent-primary/10 flex items-center justify-center">
                                            <Cpu className="w-5 h-5 text-accent-primary" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-white">Define Operational Blueprint</h2>
                                            <p className="text-xs text-text-secondary uppercase tracking-wider">JSON Source Interface</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {roles.map(r => (
                                            <Badge key={r.id} variant="secondary" className="text-[10px] uppercase">
                                                {r.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-6 overflow-y-auto custom-scrollbar">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                                        <div className="space-y-6">
                                            {/* Visual Preview */}
                                            <div className="hidden lg:block">
                                                <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2 block">Topography Preview</label>
                                                <WorkflowDiagram />
                                            </div>

                                            {/* Wizard Inputs */}
                                            <div className="bg-surface-elevated border border-border rounded-lg p-4 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs font-bold text-text-primary uppercase tracking-wider">Add Node</label>
                                                </div>
                                                <div className="grid grid-cols-12 gap-2">
                                                    <div className="col-span-5">
                                                        <input
                                                            placeholder="Step Name"
                                                            value={newStepName}
                                                            onChange={e => setNewStepName(e.target.value)}
                                                            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-primary transition-colors"
                                                        />
                                                    </div>
                                                    <div className="col-span-4">
                                                        <select
                                                            value={newStepRole}
                                                            onChange={e => setNewStepRole(e.target.value)}
                                                            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-primary transition-colors"
                                                        >
                                                            <option value="">Select Role...</option>
                                                            {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <input
                                                            type="number"
                                                            placeholder="SLA"
                                                            value={newStepSLA}
                                                            onChange={e => setNewStepSLA(Number(e.target.value))}
                                                            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-primary transition-colors"
                                                        />
                                                    </div>
                                                    <div className="col-span-1">
                                                        <Button size="sm" onClick={handleAddStep} className="w-full h-full p-0">
                                                            <Plus className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col h-full min-h-[400px]">
                                            <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2 block">Blueprint Definition (JSON)</label>
                                            <textarea
                                                value={blueprintJson}
                                                onChange={(e) => setBlueprintJson(e.target.value)}
                                                className="flex-1 bg-surface-elevated/50 border border-border rounded-lg p-4 text-accent-primary font-mono text-xs focus:outline-none focus:border-accent-primary/50 transition-all leading-relaxed resize-none"
                                                spellCheck={false}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 border-t border-border bg-transparent flex gap-3 sticky bottom-0 rounded-b-xl backdrop-blur-md">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setShowCreateModal(false)}
                                        disabled={isSubmitting}
                                        className="flex-1"
                                    >
                                        Discard
                                    </Button>
                                    <Button
                                        onClick={handleCreateWorkflow}
                                        disabled={isSubmitting}
                                        className="flex-1"
                                    >
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Commit Blueprint"}
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Payload Configuration Modal */}
                <AnimatePresence>
                    {showPayloadModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="w-full max-w-lg glass-panel rounded-xl p-0 relative overflow-hidden shadow-2xl"
                            >
                                <div className="p-6 border-b border-border">
                                    <h2 className="text-xl font-bold text-white">Initialize Sequence</h2>
                                    <p className="text-sm text-text-secondary mt-1">{showPayloadModal.name}</p>
                                </div>

                                <div className="p-6 space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Request Title</label>
                                        <input
                                            value={requestTitle}
                                            onChange={(e) => setRequestTitle(e.target.value)}
                                            className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-primary transition-colors"
                                            placeholder="e.g., System Provisioning"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Description</label>
                                        <textarea
                                            value={payload}
                                            onChange={(e) => setPayload(e.target.value)}
                                            className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-primary transition-colors h-24 resize-none"
                                            placeholder="Operational context..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Priority</label>
                                        <div className="flex gap-2">
                                            {['low', 'medium', 'high'].map((p) => (
                                                <button
                                                    key={p}
                                                    onClick={() => setRequestPriority(p)}
                                                    className={`flex-1 py-1.5 rounded-md border text-xs font-medium uppercase transition-all ${requestPriority === p
                                                        ? 'bg-accent-primary border-accent-primary text-white'
                                                        : 'bg-transparent border-border text-text-secondary hover:text-white'
                                                        }`}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 pt-0 flex gap-3">
                                    <Button
                                        variant="secondary"
                                        onClick={() => setShowPayloadModal(null)}
                                        disabled={starting !== null}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleStartWorkflow}
                                        disabled={starting !== null}
                                        className="flex-1"
                                    >
                                        {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start Request"}
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </motion.div>
        </DashboardLayout>
    );
}
