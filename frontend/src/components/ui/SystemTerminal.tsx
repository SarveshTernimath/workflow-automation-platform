"use client";

import React, { useState, useEffect } from 'react';
import { Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LOG_MESSAGES = [
    "System initializing...",
    "Connecting to neural network...",
    "Scanning for active workflows...",
    "Optimizing data routes...",
    "Checking security protocols...",
    "Syncing with cloud database...",
    "Analysing performance metrics...",
    "Deploying update patch v2.4...",
    "Establishing secure tunnel...",
    "Refreshing cache...",
    "Monitoring CPU usage...",
    "Detecting anomalies...",
    "Routing traffic...",
    "Verifying user permissions...",
    "Automating task #4029...",
    "Executing script: maintenance.sh",
    "Logging activity stream...",
    "Ping: 12ms",
    "Latency check: Optimal",
    "Data packet received: 4KB",
];

const SystemTerminal = () => {
    const [lines, setLines] = useState<string[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            const nextLog = LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)];
            const timestamp = new Date().toLocaleTimeString([], { hour12: false });

            setLines(prev => {
                const newLines = [...prev, `[${timestamp}] ${nextLog}`];
                if (newLines.length > 5) return newLines.slice(newLines.length - 5); // Keep last 5 lines
                return newLines;
            });
        }, 2500); // New log every 2.5s

        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="fixed bottom-6 right-6 z-40 hidden lg:block"
        >
            <div className="bg-black/80 backdrop-blur-md border border-accent-primary/20 rounded-lg p-3 w-64 shadow-glow font-mono text-[10px] text-accent-primary overflow-hidden">
                <div className="flex items-center space-x-2 border-b border-accent-primary/10 pb-2 mb-2">
                    <Terminal className="w-3 h-3" />
                    <span className="uppercase tracking-widest font-bold">System Log</span>
                    <div className="ml-auto w-1.5 h-1.5 bg-accent-primary rounded-full animate-pulse" />
                </div>
                <div className="space-y-1 h-24 flex flex-col justify-end">
                    <AnimatePresence mode='popLayout'>
                        {lines.map((line, i) => (
                            <motion.div
                                key={line + i}
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className="truncate hover:text-white transition-colors cursor-default"
                            >
                                <span className="opacity-50 mr-2">&gt;</span>
                                {line}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};

export default SystemTerminal;
