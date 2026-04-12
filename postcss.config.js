const tailwindPlugin = (() => {
  try {
    const mod = require('@tailwindcss/postcss');
    return mod && mod.__esModule ? mod.default || mod : mod;
  } catch (e) {
    // fallback to requiring tailwindcss directly for environments that still use it
    try { return require('tailwindcss'); } catch (e2) { throw e; }
  }
})();

module.exports = {
  plugins: [
    tailwindPlugin,
    require('autoprefixer'),
  ],
};
