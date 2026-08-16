import { build } from 'esbuild';
import { mkdir, rm, readFile, writeFile, rename } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outdir = path.join(__dirname, 'public', 'dist');
// Build into a staging dir and swap only on success. Hostinger runs this on
// deploy; a failed build must never leave the site with no assets at all.
// Kept outside public/ so build intermediates are never web-reachable.
const stagedir = path.join(__dirname, '.build-staging');

await rm(stagedir, { recursive: true, force: true });
await mkdir(stagedir, { recursive: true });

const result = await build({
	entryPoints: [path.join(__dirname, 'src', 'client', 'main.js')],
	bundle: true,
	minify: true,
	format: 'esm',
	target: ['es2020'],
	// Off by default: the map is ~3.5 MB and would ship inside deploy.zip.
	sourcemap: process.env.BUILD_SOURCEMAP === '1',
	metafile: true,
	legalComments: 'none',
	outfile: path.join(stagedir, 'app.js'),
});

// The CSS is authored by hand and has no import graph; minify it in place so
// there is exactly one pipeline producing everything under public/dist.
await build({
	entryPoints: [path.join(__dirname, 'src', 'client', 'styles.css')],
	bundle: true,
	minify: true,
	loader: { '.woff2': 'file', '.woff': 'file' },
	outfile: path.join(stagedir, 'app.css'),
});

const outputs = result.metafile.outputs;
const bundle = outputs[Object.keys(outputs).find((k) => k.endsWith('app.js'))];
const bytes = bundle ? bundle.bytes : 0;

if (bytes < 10_000) {
	throw new Error(`Bundle suspiciously small (${bytes} bytes) — build is wrong`);
}

// Emit a manifest so the server can verify the build exists before serving.
await writeFile(
	path.join(stagedir, 'build-manifest.json'),
	JSON.stringify({ builtAt: new Date().toISOString(), jsBytes: bytes }, null, 2)
);

const css = await readFile(path.join(stagedir, 'app.css'), 'utf8');
// Everything succeeded — swap staging into place.
await rm(outdir, { recursive: true, force: true });
await rename(stagedir, outdir);

console.log(`build ok — js ${(bytes / 1024).toFixed(1)} KB, css ${(css.length / 1024).toFixed(1)} KB`);
