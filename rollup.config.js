import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import typescript from '@rollup/plugin-typescript';
import dts from "rollup-plugin-dts";

import { visualizer } from "rollup-plugin-visualizer";
import process from 'process';

// `npm run build` -> `production` is true
// `npm run dev` -> `production` is false
const production = process.env.NODE_ENV === 'production'

export default [
    {
        input: 'src/app/app.ts',
        output: {
            file: 'static/ef1941.js',
            name: 'ef1941',
            format: 'iife', // immediately-invoked function expression — suitable for <script> tags
            sourcemap: true,
            exports: 'auto',
            globals: {'node:crypto': 'window'},
        },
        external: ['node:crypto'],
        plugins: [
            nodeResolve(), // find third-party modules in node_modules
            commonjs(), // convert CommonJS modules to ES6 for rollup
            typescript(),
            nodePolyfills(), // support for events etc, https://github.com/FredKSchott/rollup-plugin-polyfill-node
            production && terser(),
            visualizer({filename: "static/rollup-profile.html"}),
        ],
    },
    {
        input: 'src/engine/index.ts',
        output: {
            file: 'dist/ef1941.mjs',
            sourcemap: true,
        },
        external: ['events', 'node:crypto'],
        plugins: [
            commonjs(), // convert CommonJS modules to ES6 for rollup
            typescript({compilerOptions: {declaration: true}}),
            production && terser(),
        ],
    },
    {
        input: 'dist/src/engine/index.d.ts',
        output: {file: 'dist/ef1941.d.ts'},
        external: ['events', 'node:crypto'],
        plugins: [dts()]
    }
];
