import type { Metadata } from "next";
import "./globals.css";
import React from 'react';

export const metadata: Metadata = {
    title: "Antigravity | Strategic Workflow Orchestration",
    description: "Industrial-grade automated workflow management",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body className="antialiased selection:bg-indigo-500/30">
                <main className="min-h-screen relative overflow-hidden">
                    {/* Prestigious Branding Gradients */}
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

                    <div className="relative z-10">
                        {children}
                    </div>
                </main>
            </body>
        </html>
    );
}
