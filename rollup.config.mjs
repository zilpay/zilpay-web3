import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

const production = !process.env.ROLLUP_WATCH;

export default [
  {
    input: 'index.ts',
    output: [
      {
        dir: 'dist',
        name: 'web3',
        format: production ? 'es' : 'umd',
        sourcemap: true
      },
      {
        file: 'dist/inpage.js',
        format: 'iife',
        name: 'zilPayWeb3',
        sourcemap: true,
        plugins: [terser({
          compress: {
            drop_console: production, 
            pure_funcs: ['console.log'], 
            passes: 3 
          },
          mangle: true, 
          output: {
            comments: false 
          }
        })]
      }
    ],
    plugins: [
      resolve({ browser: true, preferBuiltins: false }),
      typescript({ sourceMap: true, declaration: true, inlineSources: true }),
      commonjs(),
      production && terser() 
    ]
  }
];
