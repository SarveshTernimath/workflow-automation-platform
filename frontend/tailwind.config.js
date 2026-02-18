/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                surface: "var(--surface)",
                "surface-hover": "var(--surface-hover)",
                "surface-active": "var(--surface-active)",
                border: "var(--border)",
                "border-hover": "var(--border-hover)",
                primary: "var(--accent-primary)",
                "primary-hover": "var(--accent-primary-hover)",
                secondary: "var(--accent-secondary)",
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'glow': '0 0 20px var(--accent-primary-glow)',
                'glow-secondary': '0 0 20px var(--accent-secondary-glow)',
            }
        },
    },
    plugins: [],
}
