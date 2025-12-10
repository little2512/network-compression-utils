import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';

export default {
  input: 'src/main.js',
  output: {
    file: 'dist/browser.js',
    format: 'iife', // Immediately Invoked Function Expression
    name: 'NetworkCompressionUtils',
    globals: {
      'lz-string': 'LZString'
    }
  },
  plugins: [
    resolve({
      browser: true,
      preferBuiltins: false
    }),
    commonjs(),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      presets: [
        ['@babel/preset-env', {
          targets: {
            browsers: ['> 1%', 'last 2 versions']
          },
          modules: false, // Don't transform modules
          useBuiltIns: 'usage',
          corejs: 3
        }]
      ]
    })
  ],
  external: ['lz-string'] // Keep LZ-String as external, we'll load it separately
};