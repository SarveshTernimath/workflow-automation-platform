import React from 'react';
import { motion } from 'framer-motion';

export const WorkflowDiagram = () => {
    const nodes = [
        { id: 1, x: 50, y: 100, label: "Trigger" },
        { id: 2, x: 250, y: 50, label: "Process A" },
        { id: 3, x: 250, y: 150, label: "Process B" },
        { id: 4, x: 450, y: 100, label: "End" },
    ];

    const edges = [
        { from: 1, to: 2 },
        { from: 1, to: 3 },
        { from: 2, to: 4 },
        { from: 3, to: 4 },
    ];

    return (
        <div className="w-full h-64 bg-surface-elevated/30 rounded-xl border border-border relative overflow-hidden backdrop-blur-sm">
            <svg className="absolute inset-0 w-full h-full">
                {edges.map((edge, i) => {
                    const start = nodes.find(n => n.id === edge.from)!;
                    const end = nodes.find(n => n.id === edge.to)!;

                    return (
                        <motion.line
                            key={i}
                            x1={start.x}
                            y1={start.y}
                            x2={end.x}
                            y2={end.y}
                            stroke="var(--accent-primary)"
                            strokeWidth="2"
                            strokeOpacity="0.2"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1.5, delay: i * 0.2, ease: "easeInOut" }}
                        />
                    );
                })}

                {edges.map((edge, i) => {
                    const start = nodes.find(n => n.id === edge.from)!;
                    const end = nodes.find(n => n.id === edge.to)!;
                    return (
                        <motion.circle
                            key={`particle-${i}`}
                            r="3"
                            fill="var(--accent-primary)"
                            initial={{ offsetDistance: "0%" }}
                            animate={{
                                cx: [start.x, end.x],
                                cy: [start.y, end.y]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "linear",
                                delay: i * 0.5
                            }}
                        />
                    );
                })}
            </svg>

            {nodes.map((node, i) => (
                <motion.div
                    key={node.id}
                    className="absolute w-24 h-12 -ml-12 -mt-6 bg-surface border border-accent-primary/30 rounded-lg flex items-center justify-center shadow-lg cursor-pointer"
                    style={{ left: node.x, top: node.y }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                        delay: i * 0.1
                    }}
                    whileHover={{ scale: 1.1, borderColor: "var(--accent-primary)" }}
                >
                    <div className="absolute inset-0 bg-accent-primary/5 rounded-lg animate-pulse" />
                    <span className="text-xs font-bold text-text-primary relative z-10">{node.label}</span>
                </motion.div>
            ))}
        </div>
    );
};
