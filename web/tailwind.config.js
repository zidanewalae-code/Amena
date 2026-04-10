/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/pages/**/*.{js,jsx}', './src/components/**/*.{js,jsx}', './src/lib/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        amena: {
          sand: '#f6f3ea',
          ink: '#182431',
          teal: '#0f766e',
          rust: '#c2622f'
        }
      }
    }
  },
  plugins: []
};
