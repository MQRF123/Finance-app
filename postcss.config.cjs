// postcss.config.cjs  (CJS evita líos ESM/CJS en Windows)
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
