import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/components/ui/Card';

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                default: "border-transparent bg-accent-primary text-white shadow hover:bg-accent-primary/80",
                secondary: "border-transparent bg-surface-elevated text-text-primary hover:bg-surface-elevated/80",
                outline: "text-text-primary border-border",
                success: "border-transparent bg-accent-success/15 text-accent-success hover:bg-accent-success/25",
                warning: "border-transparent bg-accent-warning/15 text-accent-warning hover:bg-accent-warning/25",
                error: "border-transparent bg-accent-error/15 text-accent-error hover:bg-accent-error/25",
                info: "border-transparent bg-accent-secondary/15 text-accent-secondary hover:bg-accent-secondary/25",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "secondary" | "outline" | "success" | "warning" | "error" | "info" | null;
}

export function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}
