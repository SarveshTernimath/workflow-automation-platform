"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Loader2, ArrowRight, ArrowLeft, Save, Plus, Trash2, Check, Shield, Code, Cpu, Info, Search } from "lucide-react";
import apiClient from "@/lib/api";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";

// --- Types ---

interface Role {
    id: string;
    name: string;
}

interface Step {
    tempId: string;
    name: string;
    description: string;
    step_order: number;
    sla_hours: number;
    required_role_id?: string;
    required_permission_id?: string;
    is_conditional: boolean;
}

interface Transition {
    from_step_tempId: string;
    to_step_tempId?: string;
    outcome: string;
}

// --- Component ---

export default function CreateWorkflowPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [mode, setMode] = useState<'wizard' | 'json'>('wizard');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form Data
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [workflowSteps, setWorkflowSteps] = useState<Step[]>([]);
    const [transitions, setTransitions] = useState<Transition[]>([]);
    const [jsonSource, setJsonSource] = useState<string>("");

    // Metadata
    const [roles, setRoles] = useState<Role[]>([]);

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const [rolesRes] = await Promise.all([
                    apiClient.get("roles/"),
                ]);
                setRoles(rolesRes.data);

                // Set initial JSON template
                const template = {
                    name: "NEW_PROTOCOL_" + Math.floor(Math.random() * 10000),
                    description: "High-integrity orchestration blueprint.",
                    steps: [
                        { name: "Initiation", role: "user", order: 1, sla: 24, description: "Initial data entry node" },
                        { name: "Verification", role: "manager", order: 2, sla: 24, description: "Compliance check" },
                        { name: "Final Authorization", role: "admin", order: 3, sla: 24, description: "Executive sign-off" }
                    ]
                };
                setJsonSource(JSON.stringify(template, null, 2));
            } catch (err) {
                console.error("Failed to load metadata", err);
            }
        };
        fetchMetadata();
    }, []);

    // --- Steps Management ---

    const addStep = () => {
        const newStep: Step = {
            tempId: Math.random().toString(36).substr(2, 9),
            name: `Step ${workflowSteps.length + 1}`,
            description: "",
            step_order: workflowSteps.length + 1,
            sla_hours: 24,
            is_conditional: false
        };
        setWorkflowSteps([...workflowSteps, newStep]);
    };

    const removeStep = (index: number) => {
        const newSteps = [...workflowSteps];
        newSteps.splice(index, 1);
        // Re-order
        newSteps.forEach((s, i) => s.step_order = i + 1);
        setWorkflowSteps(newSteps);
    };

    const updateStep = (index: number, field: keyof Step, value: string | number | boolean | undefined) => {
        const newSteps = [...workflowSteps];
        newSteps[index] = { ...newSteps[index], [field]: value };
        setWorkflowSteps(newSteps);
    };

    const generateDefaultTransitions = () => {
        const newTransitions: Transition[] = [];
        for (let i = 0; i < workflowSteps.length; i++) {
            const current = workflowSteps[i];
            const next = workflowSteps[i + 1];

            newTransitions.push({
                from_step_tempId: current.tempId,
                to_step_tempId: next?.tempId,
                outcome: "APPROVED"
            });

            newTransitions.push({
                from_step_tempId: current.tempId,
                to_step_tempId: undefined,
                outcome: "REJECTED"
            });
        }
        setTransitions(newTransitions);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            let finalPayload;

            if (mode === 'json') {
                const data = JSON.parse(jsonSource);

                const formattedSteps = data.steps.map((s: { role?: string; role_id?: string; name: string; description?: string; order: number; sla?: number }) => {
                    const role = roles.find(r =>
                        r.name.toLowerCase() === s.role?.toLowerCase() ||
                        r.id === s.role_id
                    );
                    return {
                        name: s.name,
                        description: s.description || "",
                        step_order: s.order,
                        sla_hours: s.sla || 24,
                        required_role_id: role ? role.id : null,
                        is_conditional: false
                    };
                });

                const transitionsResult = [];
                for (let i = 0; i < formattedSteps.length; i++) {
                    const current = formattedSteps[i];
                    const next = formattedSteps[i + 1];
                    transitionsResult.push({
                        from_step_order: current.step_order,
                        to_step_order: next ? next.step_order : null,
                        outcome: "APPROVED"
                    });
                }

                finalPayload = {
                    name: data.name,
                    description: data.description,
                    is_active: true,
                    steps: formattedSteps,
                    transitions: transitionsResult
                };
            } else {
                const formattedTransitions = transitions.map(t => {
                    const fromStep = workflowSteps.find(s => s.tempId === t.from_step_tempId);
                    const toStep = workflowSteps.find(s => s.tempId === t.to_step_tempId);

                    return {
                        from_step_order: fromStep?.step_order,
                        to_step_order: toStep?.step_order,
                        outcome: t.outcome
                    };
                });

                finalPayload = {
                    name,
                    description,
                    is_active: true,
                    steps: workflowSteps.map(s => ({
                        name: s.name,
                        description: s.description,
                        step_order: s.step_order,
                        sla_hours: s.sla_hours,
                        required_role_id: s.required_role_id || null,
                        required_permission_id: s.required_permission_id || null,
                        is_conditional: s.is_conditional
                    })),
                    transitions: formattedTransitions
                };
            }

            await apiClient.post("workflows/", finalPayload);
            router.push("/admin/workflows");
        } catch (err) {
            console.error("Failed to create workflow", err);
            alert("Validation Error: " + (err instanceof Error ? err.message : "Ensure JSON structure and role names are correct."));
        } finally {
            setIsSubmitting(false);
        }
    };

    const nextStep = () => {
        if (step === 1) {
            if (!name.trim()) {
                alert("Protocol Identifier is required.");
                return;
            }
        }
        if (step === 2) {
            if (workflowSteps.length === 0) {
                alert("At least one execution node is required.");
                return;
            }
            generateDefaultTransitions();
        }
        setStep(step + 1);
    };

    return (
        <DashboardLayout>
            <div className="min-h-[80vh] flex flex-col max-w-[1600px] mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                <Cpu className="w-5 h-5 text-indigo-400" />
                            </div>
                            <h1 className="text-2xl font-bold text-text-primary">Protocol Constructor</h1>
                        </div>
                        <p className="text-text-secondary text-sm max-w-2xl">
                            Admins define core operational blueprints here. Standard users initialize instances via the “Inventory” portal.
                        </p>
                    </div>

                    <div className="flex items-center bg-surface p-1 rounded-xl border border-border">
                        <button
                            onClick={() => setMode('wizard')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center ${mode === 'wizard' ? 'bg-indigo-500 text-white shadow-lg' : 'text-text-tertiary hover:text-text-primary'}`}
                        >
                            <Cpu className="w-3 h-3 mr-2" /> Wizard
                        </button>
                        <button
                            onClick={() => setMode('json')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center ${mode === 'json' ? 'bg-indigo-500 text-white shadow-lg' : 'text-text-tertiary hover:text-text-primary'}`}
                        >
                            <Code className="w-3 h-3 mr-2" /> Source
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-4">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center gap-4 flex-1">
                            <div className={`h-1 flex-1 rounded-full px-2 transition-all duration-500 ${s <= step ? 'bg-indigo-500 shadow-[0_0_10px_#6366f1]' : 'bg-surface'}`} />
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all duration-500 ${s === step ? 'bg-indigo-500 border-indigo-500 text-white scale-110 shadow-lg' : s < step ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-transparent border-border text-text-tertiary'}`}>
                                {s < step ? <Check className="w-4 h-4" /> : s}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Content */}
                <Card className="flex-1 glass-panel p-8 relative overflow-hidden flex flex-col min-h-[600px]">
                    <AnimatePresence mode="wait">
                        {mode === 'json' ? (
                            <motion.div key="json-mode" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex-1 flex flex-col lg:flex-row gap-8">
                                <div className="flex-1 flex flex-col">
                                    <div className="flex items-center justify-between mb-4">
                                        <label htmlFor="json-source" className="text-xs font-bold text-text-secondary uppercase tracking-wider">Blueprint Definition</label>
                                        <div className="flex items-center space-x-2 text-[10px] text-indigo-400 font-bold uppercase">
                                            <Info className="w-3 h-3" />
                                            <span>JSON Strict Schema</span>
                                        </div>
                                    </div>
                                    <textarea
                                        id="json-source"
                                        name="json_source"
                                        value={jsonSource}
                                        onChange={(e) => setJsonSource(e.target.value)}
                                        className="flex-1 bg-surface-elevated border border-border rounded-xl p-6 text-indigo-400 font-mono text-xs focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed resize-none"
                                        spellCheck={false}
                                    />
                                </div>

                                <div className="w-full lg:w-80 flex flex-col">
                                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">Node Explorer</label>
                                    <div className="flex-1 bg-surface-elevated rounded-xl border border-border p-4 overflow-hidden flex flex-col">
                                        <div className="relative mb-4">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-text-tertiary" />
                                            <input
                                                id="search-authorities"
                                                name="search_authorities"
                                                className="w-full bg-surface border border-border rounded-lg py-2 pl-8 pr-4 text-xs font-medium text-text-primary focus:outline-none focus:border-indigo-500"
                                                placeholder="Search Authorities..."
                                            />
                                        </div>
                                        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                                            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">Available Roles</p>
                                            {roles.map(r => (
                                                <div key={r.id} className="p-3 rounded-lg bg-surface border border-border flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                                                    <span className="text-xs font-medium text-text-secondary group-hover:text-text-primary">{r.name}</span>
                                                    <button
                                                        onClick={() => {
                                                            const newJson = jsonSource.replace(/("role":\s*")[^"]*(")/, `$1${r.name.toLowerCase()}$2`);
                                                            setJsonSource(newJson);
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md bg-indigo-500 text-white transition-all"
                                                    >
                                                        <ArrowRight className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <>
                                {step === 1 && (
                                    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 max-w-2xl mx-auto w-full pt-10">
                                        <div>
                                            <label htmlFor="protocol-id" className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 block">Protocol Identifier</label>
                                            <input
                                                id="protocol-id"
                                                name="protocol_id"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full bg-surface-elevated border border-border rounded-xl p-4 text-text-primary text-lg font-medium focus:outline-none focus:border-indigo-500 transition-colors"
                                                placeholder="e.g. CORE_FINANCE_APPROVAL_V1"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="protocol-desc" className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 block">Strategy Description</label>
                                            <textarea
                                                id="protocol-desc"
                                                name="protocol_desc"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                className="w-full bg-surface-elevated border border-border rounded-xl p-4 text-text-secondary font-medium h-32 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                                                placeholder="Define the purpose and scope of this operational workflow..."
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                {step === 2 && (
                                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-lg font-bold text-text-primary uppercase tracking-tight">Execution Nodes</h3>
                                            <Button onClick={addStep} variant="secondary" size="sm" className="text-xs uppercase tracking-wider">
                                                <Plus className="w-3 h-3 mr-2" /> Add Node
                                            </Button>
                                        </div>
                                        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                            {workflowSteps.map((s, idx) => (
                                                <div key={s.tempId} className="bg-surface-elevated border border-border rounded-xl p-6 relative group hover:border-indigo-500/30 transition-all">
                                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => removeStep(idx)} className="text-text-tertiary hover:text-red-400 p-2"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1 block">Node Name</label>
                                                            <input
                                                                value={s.name}
                                                                onChange={(e) => updateStep(idx, 'name', e.target.value)}
                                                                className="w-full bg-transparent border-b border-border py-2 text-text-primary font-medium focus:outline-none focus:border-indigo-500 text-sm"
                                                                placeholder="Name"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1 block">Required Authority</label>
                                                            <div className="relative">
                                                                <select
                                                                    value={s.required_role_id || ""}
                                                                    onChange={(e) => updateStep(idx, 'required_role_id', e.target.value || undefined)}
                                                                    className="w-full bg-transparent border-b border-border py-2 text-indigo-400 font-medium focus:outline-none focus:border-indigo-500 text-sm appearance-none cursor-pointer"
                                                                >
                                                                    <option value="" className="bg-surface">No Restriction</option>
                                                                    {roles.map(r => (
                                                                        <option key={r.id} value={r.id} className="bg-surface">{r.name}</option>
                                                                    ))}
                                                                </select>
                                                                <Shield className="w-3 h-3 text-text-tertiary absolute right-0 top-3 pointer-events-none" />
                                                            </div>
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1 block">Description</label>
                                                            <input
                                                                value={s.description}
                                                                onChange={(e) => updateStep(idx, 'description', e.target.value)}
                                                                className="w-full bg-transparent border-b border-border py-2 text-text-secondary text-xs focus:outline-none focus:border-indigo-500"
                                                                placeholder="What happens at this step?"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center text-[10px] font-bold text-text-secondary">
                                                        {idx + 1}
                                                    </div>
                                                </div>
                                            ))}
                                            {workflowSteps.length === 0 && (
                                                <div className="text-center py-10 text-text-tertiary uppercase text-[10px] font-bold tracking-widest">
                                                    No execution nodes defined
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {step === 3 && (
                                    <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 flex-1 flex flex-col items-center justify-center text-center">
                                        <div className="space-y-4">
                                            <div className="inline-flex p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 mb-4 items-center justify-center">
                                                <Check className="w-12 h-12 text-emerald-500" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-text-primary uppercase tracking-tight">Protocol Matrix Validated</h3>
                                            <p className="text-text-secondary text-sm max-w-lg mx-auto">
                                                The system has automatically generated a linear execution logic for your {workflowSteps.length} nodes.
                                                Standard &quot;Approve&quot; and &quot;Reject&quot; pathways have been synthesized.
                                            </p>
                                        </div>

                                        <div className="bg-surface-elevated rounded-xl p-8 border border-border w-full max-w-2xl relative overflow-hidden text-left">
                                            <pre className="text-[10px] text-indigo-300 font-mono leading-relaxed opacity-70">
                                                {JSON.stringify({
                                                    protocol: name,
                                                    nodes: workflowSteps.length,
                                                    paths: transitions.length,
                                                    topology: "LINEAR_OPTIMIZED"
                                                }, null, 2)}
                                            </pre>
                                            <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
                                        </div>
                                    </motion.div>
                                )}
                            </>
                        )}
                    </AnimatePresence>

                    {/* Footer Actions */}
                    <div className="flex justify-between items-center mt-10 pt-8 border-t border-border bg-black/20">
                        {mode === 'wizard' ? (
                            <Button
                                variant="ghost"
                                disabled={step === 1}
                                onClick={() => setStep(step - 1)}
                                className="text-xs uppercase tracking-wider"
                            >
                                <ArrowLeft className="w-3 h-3 mr-2" /> Back
                            </Button>
                        ) : (
                            <div />
                        )}

                        {mode === 'wizard' ? (
                            step < 3 ? (
                                <Button
                                    onClick={nextStep}
                                    className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 text-xs uppercase tracking-wider"
                                >
                                    Continue <ArrowRight className="w-3 h-3 ml-2" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 text-xs uppercase tracking-wider"
                                >
                                    {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Save className="w-3 h-3 mr-2" />}
                                    Initialize Protocol
                                </Button>
                            )
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 text-xs uppercase tracking-wider"
                            >
                                {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Plus className="w-3 h-3 mr-2" />}
                                Commit Source Blueprint
                            </Button>
                        )}
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}
