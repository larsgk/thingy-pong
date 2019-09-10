import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import { terser } from "rollup-plugin-terser";
import copy from 'rollup-plugin-copy-assets-to';
import cleaner from 'rollup-plugin-cleaner';

const production = !process.env.ROLLUP_WATCH;

export default {
    input: 'src/index.js',
	output: {
		file: 'docs/index.js',
        format: 'es',
		sourcemap: true
	},
	plugins: [
        production && cleaner({  // Only remove ./build when building for production.
            targets: [
              './docs/'
            ]
        }),
        copy({
            assets: [
                './assets',
                './manifest.json',
                './src/index.html',
                'node_modules/@webcomponents/webcomponentsjs/bundles',
                'node_modules/@webcomponents/webcomponentsjs/webcomponents-loader.js'
            ],
            outputDir: 'docs'
        }),
        resolve(),
        commonjs(),
        production && terser(), // minify, but only in production
        babel({
            exclude: 'node_modules/**',
        }),
    ]
};