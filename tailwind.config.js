/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#080c10',
        bg2: '#0d1117',
        bg3: '#131b24',
        border: '#1e2d3d',
        border2: '#243447',
        text: '#c9d8e8',
        text2: '#6b8299',
        text3: '#3a4f63',
        green: '#00e5a0',
        green2: '#00b87a',
        greenDim: '#001f15',
        blue: '#38b6ff',
        blueDim: '#001929',
        amber: '#ffb830',
        amberDim: '#1f1400',
        red: '#ff4757',
        redDim: '#1f0007',
        accent: '#38b6ff',
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
