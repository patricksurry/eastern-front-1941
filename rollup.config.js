import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import eslint from '@rollup/plugin-eslint';

// `npm run build` -> `production` is true
// `npm run dev` -> `production` is false
const production = !process.env.ROLLUP_WATCH;

export default {
    input: 'src/main.js',
    output: {
        file: 'static/ef1941.js',
        name: 'ef1941',
        format: 'iife', // immediately-invoked function expression — suitable for <script> tags
        sourcemap: true,
        exports: 'auto',  // ? Disable warning for default imports in D3
    },
    onwarn: function (warning, warn) {
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        warn(warning);
    },
    plugins: [
        eslint(),
        resolve(), // tells Rollup how to find date-fns in node_modules
        commonjs(), // converts date-fns to ES modules
        production && terser() // minify, but only in production
    ]
};
