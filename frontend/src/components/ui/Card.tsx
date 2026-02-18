import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    glass?: boolean;
}

export function Card({ className, glass = true, ...props }: CardProps) {
    return (
        <div
            className={cn(
                "rounded-xl border border-border bg-surface transition-all duration-300",
                glass && "glass-panel hover:glass-panel-hover",
                className
            )}
            {...props}
        />
    );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return <h3 className={cn("text-lg font-bold tracking-tight text-text-primary", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("p-6 pt-0", className)} {...props} />;
}

