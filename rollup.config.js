import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import typescript from '@rollup/plugin-typescript';
import { visualizer } from "rollup-plugin-visualizer";
import process from 'process';

// `npm run build` -> `production` is true
// `npm run dev` -> `production` is false
const production = !process.env.ROLLUP_WATCH,
    plugins = [
        typescript(),
        nodeResolve(), // find third-party modules in node_modules
        commonjs(), // convert CommonJS modules to ES6 for rollup
        nodePolyfills(), // support for events etc, https://github.com/FredKSchott/rollup-plugin-polyfill-node
        visualizer({filename: "rollup-profile.html"}),
        production && terser() // minify, but only in production
    ];

export default {
    input: 'src/app.ts',
    output: {
        file: 'static/ef1941.js',
        name: 'ef1941',
        format: 'iife', // immediately-invoked function expression — suitable for <script> tags
        sourcemap: true,
        exports: 'auto',
        globals: {'node:crypto': 'window'},
    },
    external: ['node:crypto'],
    onwarn: function (warning, warn) {
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        warn(warning);
    },
    plugins: plugins,
};
