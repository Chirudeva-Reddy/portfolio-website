// Deployment preflight. Run before packaging deploy.zip:  npm run preflight
// Exits non-zero on anything that must not reach production.
import { readFile, stat } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(fileURLToPath(import.meta.url));
const failures = [];
const warnings = [];

const check = async (label, fn) => {
	try {
		const result = await fn();
		if (result === true) return console.log(`  PASS  ${label}`);
		if (result && result.warn) {
			warnings.push(`${label}: ${result.warn}`);
			return console.log(`  WARN  ${label} — ${result.warn}`);
		}
		failures.push(`${label}: ${result}`);
		console.log(`  FAIL  ${label} — ${result}`);
	} catch (err) {
		failures.push(`${label}: ${err.message}`);
		console.log(`  FAIL  ${label} — ${err.message}`);
	}
};

console.log('\nPreflight — https://chirudevareddy.com\n');

await check('production bundle exists', async () => {
	const s = await stat(path.join(root, 'public', 'dist', 'app.js'));
	return s.size > 10_000 || `bundle only ${s.size} bytes`;
});

await check('stylesheet bundle exists', async () => {
	const s = await stat(path.join(root, 'public', 'dist', 'app.css'));
	return s.size > 5_000 || `stylesheet only ${s.size} bytes`;
});

await check('resume is a real CV, not the placeholder', async () => {
	const p = path.join(root, 'private', 'resume.pdf');
	let s;
	try {
		s = await stat(p);
	} catch {
		return 'private/resume.pdf is missing';
	}
	// The generated stub is ~820 bytes; any real multi-page CV is far larger.
	return s.size > 20_000 || `resume.pdf is ${s.size} bytes — still the placeholder stub`;
});

await check('no hand-vendored module directory', async () => {
	try {
		await stat(path.join(root, 'public', 'vendor'));
		return 'public/vendor still exists — the bundle should be the only source';
	} catch {
		return true;
	}
});

await check('no third-party bundles in the web root', async () => {
	for (const dir of ['plugins', 'lax.min.js', 'assets/logos']) {
		try {
			await stat(path.join(root, 'public', dir));
			return `public/${dir} still present`;
		} catch {
			/* expected */
		}
	}
	return true;
});

await check('canonical metadata points at the production origin', async () => {
	const html = await readFile(path.join(root, 'index.html'), 'utf8');
	if (!html.includes('rel="canonical" href="https://chirudevareddy.com/"')) return 'canonical missing or wrong';
	if (html.includes('localhost') || html.includes('127.0.0.1')) return 'localhost URL present in markup';
	return true;
});

await check('no import map / stale asset references', async () => {
	const html = await readFile(path.join(root, 'index.html'), 'utf8');
	if (html.includes('importmap')) return 'import map still present';
	if (html.includes('scripts.min.js') || html.includes('styles.min.css')) return 'stale asset reference';
	return true;
});

await check('manifest names the right person', async () => {
	const m = JSON.parse(await readFile(path.join(root, 'public', 'assets', 'favicon', 'site.webmanifest'), 'utf8'));
	return m.name.includes('Chirudeva') || `manifest name is "${m.name}"`;
});

await check('robots.txt and sitemap are populated', async () => {
	const robots = await readFile(path.join(root, 'public', 'robots.txt'), 'utf8');
	const sitemap = await readFile(path.join(root, 'public', 'sitemap.xml'), 'utf8');
	if (!robots.includes('Sitemap:')) return 'robots.txt has no sitemap reference';
	if (!sitemap.includes('chirudevareddy.com')) return 'sitemap has no production URL';
	return true;
});

console.log('');
if (failures.length) {
	console.error(`PREFLIGHT FAILED — ${failures.length} blocking issue(s):`);
	failures.forEach((f) => console.error(`  - ${f}`));
	process.exit(1);
}
console.log(`Preflight passed${warnings.length ? ` with ${warnings.length} warning(s)` : ''}.\n`);
