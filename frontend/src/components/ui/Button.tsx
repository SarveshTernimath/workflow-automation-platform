import React from 'react';
import { cva } from 'class-variance-authority';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/components/ui/Card'; // Reusing cn utility

const buttonVariants = cva(
    "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-accent-primary text-white hover:bg-accent-primary-hover shadow-lg hover:shadow-glow",
                secondary: "bg-surface-elevated text-text-primary border border-border hover:bg-surface-hover hover:border-border-hover",
                outline: "border border-input bg-transparent hover:bg-surface-hover text-text-primary",
                ghost: "hover:bg-surface-hover text-text-secondary hover:text-text-primary",
                danger: "bg-accent-error text-white hover:bg-red-600 shadow-lg hover:shadow-red-500/20",
                link: "text-accent-primary underline-offset-4 hover:underline",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-11 rounded-md px-8 text-base",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface ButtonProps
    extends Omit<HTMLMotionProps<"button">, "children"> {
    variant?: "default" | "secondary" | "outline" | "ghost" | "danger" | "link" | null;
    size?: "default" | "sm" | "lg" | "icon" | null;
    loading?: boolean;
    children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, loading, children, ...props }, ref) => {
        return (
            <motion.button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                whileTap={{ scale: 0.98 }}
                {...props}
            >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </motion.button>
        );
    }
);
Button.displayName = "Button";
