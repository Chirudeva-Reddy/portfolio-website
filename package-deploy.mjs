// Builds deploy.zip for Hostinger. Explicit allow-list: everything the app
// needs to install, build and run — and nothing else. A blanket zip of the repo
// carries ~136 MB of .agents skills and the scratch clones.
import { execFile } from 'child_process';
import { promisify } from 'util';
import { rm, mkdir, cp, stat } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const run = promisify(execFile);
const root = path.dirname(fileURLToPath(import.meta.url));
const staging = path.join(root, '.deploy-staging');
const zipPath = path.join(root, 'deploy.zip');

// Runtime + build inputs only. Hostinger runs `npm install` then `npm run build`
// then starts app.js via Passenger.
const INCLUDE = [
	'app.js',
	'build.mjs',
	'preflight.mjs',
	'index.html',
	'package.json',
	'package-lock.json',
	'src/client',
	'public',
	'private',
];

await rm(staging, { recursive: true, force: true });
await rm(zipPath, { force: true });
await mkdir(staging, { recursive: true });

for (const entry of INCLUDE) {
	const from = path.join(root, entry);
	try {
		await stat(from);
	} catch {
		throw new Error(`Required deploy input missing: ${entry}`);
	}
	await cp(from, path.join(staging, entry), { recursive: true });
}

// Build output is included as a safety net: if the host build ever fails, the
// previously verified assets are already there.
await rm(path.join(staging, 'public', '.dist-staging'), { recursive: true, force: true });

// public/ is copied wholesale, so prune anything that must never be served.
// public/plugins is regenerated on this machine by a local design-tool plugin;
// deleting it from the repo does not stop it coming back, so it is pruned here
// (and gitignored) rather than fought with.
const NEVER_SHIP = ['plugins', 'lax.min.js', 'assets/logos', 'assets/technologies'];
for (const entry of NEVER_SHIP) {
	await rm(path.join(staging, 'public', entry), { recursive: true, force: true });
}

await run('zip', ['-r', '-q', '-X', zipPath, '.'], { cwd: staging });
await rm(staging, { recursive: true, force: true });

const { size } = await stat(zipPath);
console.log(`deploy.zip ready — ${(size / 1024 / 1024).toFixed(1)} MB`);
console.log('Upload via hPanel > Node.js app > Deploy from archive.');
