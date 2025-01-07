/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundColor: {
        'primary': '#ffffff',
        'secondary': '#f3f4f6',
      },
      textColor: {
        'primary': '#111827',
        'secondary': '#4b5563',
      },
    },
  },
  plugins: [],
}
