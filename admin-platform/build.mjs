import {build} from 'esbuild';
import {mkdir,copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url));
await mkdir(new URL('./dist/assets/',import.meta.url),{recursive:true});
await build({absWorkingDir:root,entryPoints:['src/main.tsx'],bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:'dist/assets/app.js',jsx:'automatic',minify:true,logLevel:'warning',define:{'process.env.NODE_ENV':'"production"'}});
await copyFile(new URL('./index.html',import.meta.url),new URL('./dist/index.html',import.meta.url));
