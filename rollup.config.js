import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import eslint from '@rollup/plugin-eslint';

// `npm run build` -> `production` is true
// `npm run dev` -> `production` is false
const production = !process.env.ROLLUP_WATCH;

export default {
    input: 'src/ui.js',
    output: {
        file: 'static/ef1941.js',
        name: 'ef1941',
        format: 'iife', // immediately-invoked function expression — suitable for <script> tags
        sourcemap: true,
        exports: 'auto',
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

/*
Entry module "node_modules/d3-array/src/bisector.js" is implicitly using "default" export mode,
which means for CommonJS output that its default export is assigned to "module.exports".
For many tools, such CommonJS output will not be interchangeable with the original ES module.
If this is intended, explicitly set "output.exports" to either "auto" or "default",
otherwise you might want to consider changing the signature of "node_modules/d3-array/src/bisector.js" to use named exports only.
*/
