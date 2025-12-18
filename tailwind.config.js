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
                // Override default Slate (blue-ish gray) with Neutral (true gray)
                slate: require('tailwindcss/colors').neutral,
                // Override default Indigo with Emerald for a "Wealth" feel (Green)
                indigo: require('tailwindcss/colors').emerald,
            }
        },
    },
    plugins: [],
}
