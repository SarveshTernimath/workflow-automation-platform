"use client";

import React, { useEffect, useRef } from 'react';

export const WorkflowNetworkBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;

        canvas.width = width;
        canvas.height = height;

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };
        window.addEventListener('resize', resize);

        // Particle System
        class Particle {
            x: number;
            y: number;
            vx: number; // Velocity x
            vy: number; // Velocity y
            size: number;
            color: string;
            connections: Particle[] = []; // Track connected nodes

            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.5; // Slow ambient movement
                this.vy = (Math.random() - 0.5) * 0.5;
                this.size = Math.random() * 2 + 1;
                // Cyberpunk / Neon colors
                this.color = Math.random() > 0.8 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(59, 130, 246, 0.5)';
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                // Wrap around screen
                if (this.x < 0) this.x = width;
                if (this.x > width) this.x = 0;
                if (this.y < 0) this.y = height;
                if (this.y > height) this.y = 0;

                // Clear connections each frame to recalculate based on distance
                this.connections = [];
            }

            draw() {
                if (!ctx) return;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
            }
        }

        // Data Packet System
        class Packet {
            x: number;
            y: number;
            target: Particle;
            speed: number;
            progress: number; // 0 to 1
            start: { x: number, y: number };
            color: string;
            active: boolean;

            constructor(startNode: Particle, targetNode: Particle) {
                this.start = { x: startNode.x, y: startNode.y }; // Snapshot start position
                this.target = targetNode;
                this.x = startNode.x;
                this.y = startNode.y;
                this.speed = 0.02 + Math.random() * 0.03; // Random speed
                this.progress = 0;
                this.color = Math.random() > 0.5 ? '#ef4444' : '#3b82f6'; // Bright packet color
                this.active = true;
            }

            update() {
                this.progress += this.speed;
                if (this.progress >= 1) {
                    this.active = false;
                    return;
                }

                // Linear interpolation between start and current target position
                this.x = this.start.x + (this.target.x - this.start.x) * this.progress;
                this.y = this.start.y + (this.target.y - this.start.y) * this.progress;
            }

            draw() {
                if (!ctx || !this.active) return;
                ctx.beginPath();
                ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.color;
                ctx.fill();
                ctx.shadowBlur = 0; // Reset
            }
        }


        const particleCount = Math.min(Math.floor((width * height) / 12000), 80); // Responsive count
        const particles: Particle[] = [];
        let packets: Packet[] = [];

        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        // Animation Loop
        const animate = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, width, height);

            // Update Nodes
            particles.forEach((p, i) => {
                p.update();
                p.draw();

                // Connect nearby particles
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const distSq = dx * dx + dy * dy;

                    // Connection Distance Threshold (squared to avoid sqrt)
                    if (distSq < 22500) { // 150*150
                        p.connections.push(p2); // Store connection for packet routing

                        const opacity = 1 - Math.sqrt(distSq) / 150;
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(59, 130, 246, ${opacity * 0.5})`; // Faint blue lines
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();

                        // Chance to spawn a data packet
                        if (Math.random() < 0.002) { // Low chance per frame per connection
                            packets.push(new Packet(p, p2));
                        }
                    }
                }
            });

            // Update Packets
            packets = packets.filter(pkt => pkt.active); // Remove finished packets
            packets.forEach(pkt => {
                pkt.update();
                pkt.draw();
            });

            requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-0 pointer-events-none opacity-60 mix-blend-screen"
        />
    );
};
