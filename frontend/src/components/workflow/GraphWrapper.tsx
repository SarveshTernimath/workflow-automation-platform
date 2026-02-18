"use client";

import dynamic from 'next/dynamic';

const WorkflowGraph3D = dynamic(
    () => import('./WorkflowGraph3D'),
    {
        ssr: false,
        loading: () => <div className="h-[600px] w-full bg-black/50 animate-pulse rounded-xl" />
    }
);

export default WorkflowGraph3D;
