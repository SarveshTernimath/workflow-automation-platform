

export const animations = {
    // Stagger children
    staggerContainer: {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1,
            },
        },
    },

    // Basic fade up
    fadeInUp: {
        hidden: { opacity: 0, y: 20 },
        show: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 15
            }
        },
    },

    // Slide in from right (for menus/sidebars)
    slideInRight: {
        hidden: { x: 20, opacity: 0 },
        show: {
            x: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 120,
                damping: 20
            }
        },
    },

    // Scale up
    scaleUp: {
        hidden: { scale: 0.95, opacity: 0 },
        show: {
            scale: 1,
            opacity: 1,
            transition: {
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1] // Custom ease 'premium'
            }
        },
    },

    // Hover effects
    hoverScale: {
        scale: 1.02,
        transition: { duration: 0.2 }
    },

    hoverPop: {
        y: -4,
        boxShadow: "0 12px 24px -10px rgba(0,0,0,0.3)",
        transition: { duration: 0.3, ease: "easeOut" }
    },

    // Loading shim
    shimmer: {
        initial: { backgroundPosition: "-200% 0" },
        animate: {
            backgroundPosition: "200% 0",
            transition: {
                repeat: Infinity,
                duration: 2,
                ease: "linear"
            }
        }
    }
};

export const transition = {
    smooth: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
    spring: { type: "spring", stiffness: 100, damping: 20 },
    bounce: { type: "spring", stiffness: 200, damping: 10 },
};
