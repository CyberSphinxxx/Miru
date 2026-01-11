/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                miru: {
                    bg: '#0a0a0a',
                    surface: '#111111',
                    'surface-light': '#1a1a1a',
                    accent: '#8b5cf6',
                    'accent-light': '#a78bfa',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
