
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(__dirname, 'src/**/!(*.stories|*.spec).{ts,html}'),

  ],
  theme: {
    extend: {
      fontFamily: {
        bytesized: ['Bytesized', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
