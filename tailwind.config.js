/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Using Slate (cool gray) instead of Neutral for that premium tech/finance look
                slate: require('tailwindcss/colors').slate,
                // Reverting indigo/emerald overrides to let the CSS theme handle it, 
                // or explicitly defining them if needed. 
                // Let's keep them as standard tailwind names but customize in CSS.
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }
        },
    },
    plugins: [],
}
