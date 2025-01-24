import resolve from 'rollup-plugin-node-resolve';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/kepler-ui.js',
    format: 'esm',
  },
  plugins: [resolve(), terser()],
};
