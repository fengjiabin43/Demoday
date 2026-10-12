import {cp, writeFile} from 'node:fs/promises';

await cp(new URL('../admin-platform/dist/', import.meta.url), new URL('../dist/admin/', import.meta.url), {recursive:true});
await writeFile(new URL('../dist/.nojekyll', import.meta.url), '');
console.log('GitHub Pages build complete: dist/ (learning app) and dist/admin/ (admin demo)');
