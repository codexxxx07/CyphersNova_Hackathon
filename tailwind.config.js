/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './script.js', './data.js', './utils.js'],
  theme: {
    extend: {
      colors: {
        offwhite: '#f8fafc',
        accent: {
          blue: '#2563eb',
          green: '#22c55e',
        },
      },
      boxShadow: {
        brutal: '4px 4px 0px 0px #000000',
        'brutal-sm': '3px 3px 0px 0px #000000',
        'brutal-lg': '6px 6px 0px 0px #000000',
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
