import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';

// External dependencies (not bundled)
const external = ['lz-string'];

// Common plugins configuration
const basePlugins = [
  nodeResolve(),
  commonjs(),
  babel({
    babelHelpers: 'runtime',
    exclude: 'node_modules/**',
    presets: [
      ['@babel/preset-env', {
        targets: {
          browsers: ['> 1%', 'last 2 versions', 'not dead']
        },
        modules: false,
        useBuiltIns: 'usage',
        corejs: 3
      }]
    ],
    plugins: [
      ['@babel/plugin-transform-runtime', {
        corejs: 3,
        helpers: true,
        regenerator: true,
        useESModules: false
      }]
    ]
  })
];

// Terser options for optimal compression
const terserOptions = {
  compress: {
    drop_console: true, // Remove console.log in production
    drop_debugger: true,
    pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
    passes: 2
  },
  mangle: {
    properties: {
      regex: /^_/ // Only mangle private properties
    }
  },
  format: {
    comments: false
  }
};

export default [
  // ES Module build (no minification for debugging)
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.esm.js',
      format: 'esm'
    },
    external,
    plugins: basePlugins
  },
  // CommonJS build (no minification for debugging)
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      exports: 'named'
    },
    external,
    plugins: basePlugins
  },
  // UMD build (minified for production)
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'NetworkCompressionUtils'
    },
    external,
    plugins: [
      ...basePlugins,
      terser(terserOptions)
    ]
  }
];