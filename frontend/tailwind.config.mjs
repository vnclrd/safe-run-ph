/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.json",
  ],
  safelist: [
    // --- Main Card Gradients & Backgrounds ---
    'from-orange-500', 'to-rose-500',
    'from-sky-400', 'to-blue-500',
    'from-amber-400', 'to-orange-500',
    'from-emerald-400', 'to-cyan-500',
    'bg-rose-500/90', 'bg-blue-600/60', 'bg-orange-600/60', 'bg-emerald-600/60',
    'bg-rose-50', 'bg-indigo-50', 'bg-orange-50', 'bg-teal-50',
    'text-rose-600', 'text-blue-600', 'text-orange-600', 'text-emerald-600',

    // --- Metric Card Text Colors ---
    'text-emerald-500', // Good / Dry / Calm
    'text-amber-500',   // High Humidity / Light Rain / Breezy
    'text-orange-500',  // Windy
    'text-rose-500',    // Extreme Humidity / Heavy Rain / Danger Wind
    'text-blue-500',    // Low Humidity
    'text-sky-400',     // Precipitation % color
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};