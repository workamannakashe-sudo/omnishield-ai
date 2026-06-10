/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#05080d",
        panel: "#080d14",
        borderCls: "#162030",
        green: "#00f0a0",
        blue: "#2eb8ff",
        amber: "#ffcc44",
        red: "#ff3b5c",
        purple: "#b066ff",
        cyan: "#00e8e8",
      },
      fontFamily: {
        display: ["Outfit", "sans-serif"],
        mono: ["Space Mono", "monospace"],
      },
    },
  },
  plugins: [],
}
