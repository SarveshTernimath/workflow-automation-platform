"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Loader2, ArrowRight, ArrowLeft, Save, Plus, Trash2, Check, Shield, Lock } from "lucide-react";
import apiClient from "@/lib/api";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---

interface Role {
    id: string;
    name: string;
}

interface Permission {
    id: string;
    name: string;
}

interface Step {
    tempId: string; // for frontend tracking
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
    to_step_tempId?: string; // undefined means END
    outcome: string; // e.g. "APPROVED"
}

// --- Component ---

export default function CreateWorkflowPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form Data
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [workflowSteps, setWorkflowSteps] = useState<Step[]>([]);
    const [transitions, setTransitions] = useState<Transition[]>([]);

    // Metadata
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const [rolesRes, permsRes] = await Promise.all([
                    apiClient.get("/roles/"),
                    apiClient.get("/permissions/")
                ]);
                setRoles(rolesRes.data);
                setPermissions(permsRes.data);
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

    const updateStep = (index: number, field: keyof Step, value: any) => {
        const newSteps = [...workflowSteps];
        newSteps[index] = { ...newSteps[index], [field]: value };
        setWorkflowSteps(newSteps);
    };

    // --- Transitions Management logic (Simplified for Auto-Linking) ---

    // When moving to step 3, we auto-generate default linear transitions
    // User can edit specialized branching later if we add that UI complexity
    // For this MVP, we will auto-generate linear flow: Step 1 -> Step 2 -> ... -> End
    const generateDefaultTransitions = () => {
        const newTransitions: Transition[] = [];
        for (let i = 0; i < workflowSteps.length; i++) {
            const current = workflowSteps[i];
            const next = workflowSteps[i + 1];

            // Standard Approval Path
            newTransitions.push({
                from_step_tempId: current.tempId,
                to_step_tempId: next?.tempId, // undefined if last step
                outcome: "APPROVED"
            });

            // Standard Rejection Path (Terminates flow)
            newTransitions.push({
                from_step_tempId: current.tempId,
                to_step_tempId: undefined, // Terminate
                outcome: "REJECTED"
            });
        }
        setTransitions(newTransitions);
    };


    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // Map tempIds back to step orders for the backend API
            const formattedTransitions = transitions.map(t => {
                const fromStep = workflowSteps.find(s => s.tempId === t.from_step_tempId);
                const toStep = workflowSteps.find(s => s.tempId === t.to_step_tempId);

                return {
                    from_step_order: fromStep?.step_order,
                    to_step_order: toStep?.step_order, // API expects order or null
                    outcome: t.outcome
                };
            });

            const payload = {
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

            await apiClient.post("/workflows/", payload);
            router.push("/admin/workflows");
        } catch (err) {
            console.error("Failed to create workflow", err);
            alert("Failed to create workflow. Please check inputs.");
            setIsSubmitting(false);
        }
    };

    const nextStep = () => {
        if (step === 2) generateDefaultTransitions();
        setStep(step + 1);
    };

    return (
        <DashboardLayout>
            <div className="min-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="mb-12">
                    <div className="flex items-center space-x-2 mb-3">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Protocol Constructor</span>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Define New Strategy</h1>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-4 mb-12">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center gap-4 flex-1">
                            <div className={`h-1 flex-1 rounded-full px-2 transition-all duration-500 ${s <= step ? 'bg-indigo-500 shadow-[0_0_10px_#6366f1]' : 'bg-white/5'}`} />
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border transition-all duration-500 ${s === step ? 'bg-indigo-500 border-indigo-500 text-white scale-110 shadow-lg' : s < step ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-transparent border-white/10 text-slate-600'}`}>
                                {s < step ? <Check className="w-4 h-4" /> : s}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Content */}
                <Card className="flex-1 glass-dark border border-white/5 p-10 relative overflow-hidden flex flex-col">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Protocol Identifier</label>
                                    <input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-slate-900 border border-white/10 rounded-2xl p-6 text-white text-xl font-bold focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-700"
                                        placeholder="e.g. CORE_FINANCE_APPROVAL_V1"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Strategy Description</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full bg-slate-900 border border-white/10 rounded-2xl p-6 text-slate-300 font-medium h-40 focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-700 resize-none"
                                        placeholder="Define the purpose and scope of this operational workflow..."
                                    />
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-black text-white uppercase italic">Execution Nodes</h3>
                                    <button onClick={addStep} className="bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-indigo-500/20 flex items-center">
                                        <Plus className="w-3 h-3 mr-2" /> Add Node
                                    </button>
                                </div>
                                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                    {workflowSteps.map((s, idx) => (
                                        <div key={s.tempId} className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 relative group hover:border-indigo-500/20 transition-all">
                                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => removeStep(idx)} className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Node Name</label>
                                                    <input
                                                        value={s.name}
                                                        onChange={(e) => updateStep(idx, 'name', e.target.value)}
                                                        className="w-full bg-transparent border-b border-white/10 py-2 text-white font-bold focus:outline-none focus:border-indigo-500 text-sm"
                                                        placeholder="Name"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Required Authority</label>
                                                    <div className="relative">
                                                        <select
                                                            value={s.required_role_id || ""}
                                                            onChange={(e) => updateStep(idx, 'required_role_id', e.target.value || undefined)}
                                                            className="w-full bg-transparent border-b border-white/10 py-2 text-indigo-400 font-bold focus:outline-none focus:border-indigo-500 text-sm appearance-none cursor-pointer"
                                                        >
                                                            <option value="" className="bg-slate-900 text-slate-500">No Restriction</option>
                                                            {roles.map(r => (
                                                                <option key={r.id} value={r.id} className="bg-slate-900">{r.name}</option>
                                                            ))}
                                                        </select>
                                                        <Shield className="w-3 h-3 text-slate-600 absolute right-0 top-3 pointer-events-none" />
                                                    </div>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Description</label>
                                                    <input
                                                        value={s.description}
                                                        onChange={(e) => updateStep(idx, 'description', e.target.value)}
                                                        className="w-full bg-transparent border-b border-white/10 py-2 text-slate-400 text-xs focus:outline-none focus:border-indigo-500"
                                                        placeholder="What happens at this step?"
                                                    />
                                                </div>
                                            </div>
                                            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-[10px] font-black text-slate-500">
                                                {idx + 1}
                                            </div>
                                        </div>
                                    ))}
                                    {workflowSteps.length === 0 && (
                                        <div className="text-center py-10 text-slate-600 uppercase text-[10px] font-black tracking-widest">
                                            No execution nodes defined
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 flex-1 flex flex-col">
                                <div className="text-center space-y-4">
                                    <div className="inline-flex p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 mb-4 items-center justify-center">
                                        <Check className="w-12 h-12 text-emerald-500" />
                                    </div>
                                    <h3 className="text-2xl font-black text-white uppercase italic">Protocol Matrix Validated</h3>
                                    <p className="text-slate-400 text-sm max-w-lg mx-auto">
                                        The system has automatically generated a linear execution logic for your {workflowSteps.length} nodes.
                                        Standard "Approve" and "Reject" pathways have been synthesized.
                                    </p>
                                </div>

                                <div className="bg-slate-900/50 rounded-2xl p-8 border border-white/5 flex-1 relative overflow-hidden">
                                    <pre className="text-[10px] text-indigo-300 font-mono leading-relaxed opacity-70">
                                        {JSON.stringify({
                                            protocol: name,
                                            nodes: workflowSteps.length,
                                            paths: transitions.length,
                                            topology: "LINEAR_OPTIMIZED"
                                        }, null, 2)}
                                    </pre>
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Footer Actions */}
                    <div className="flex justify-between items-center mt-10 pt-8 border-t border-white/5">
                        <button
                            disabled={step === 1}
                            onClick={() => setStep(step - 1)}
                            className="bg-transparent text-slate-500 hover:text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-0 flex items-center"
                        >
                            <ArrowLeft className="w-3 h-3 mr-2" /> Back
                        </button>

                        {step < 3 ? (
                            <button
                                onClick={nextStep}
                                disabled={step === 1 && !name}
                                className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 flex items-center hover:scale-105 active:scale-95"
                            >
                                Continue <ArrowRight className="w-3 h-3 ml-2" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 flex items-center hover:scale-105 active:scale-95 group"
                            >
                                {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Save className="w-3 h-3 mr-2" />}
                                Initialize Protocol
                            </button>
                        )}
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}

