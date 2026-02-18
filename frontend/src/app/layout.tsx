import type { Metadata } from "next";
import "./globals.css";
import React from 'react';

export const metadata: Metadata = {
    title: "NexusFlow | Strategic Workflow Orchestration",
    description: "Industrial-grade automated workflow management",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body className="antialiased">
                {children}
            </body>
        </html>
    );
}
