import express from 'express';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';
import helmet from 'helmet';

const app = express();

app.disable('x-powered-by');

// The one inline script is the progressive-enhancement bootstrap in index.html.
// Hashing it lets script-src drop 'unsafe-inline' entirely. Computed at startup
// from the file itself, so it can never drift out of sync with the markup.
const indexHtmlPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'index.html');
const inlineScriptHashes = (() => {
	try {
		const html = fs.readFileSync(indexHtmlPath, 'utf8');
		return [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(
			(m) => `'sha256-${crypto.createHash('sha256').update(m[1], 'utf8').digest('base64')}'`
		);
	} catch {
		return [];
	}
})();

app.use(
	helmet({
		contentSecurityPolicy: {
			useDefaults: false,
			directives: {
				'default-src': ["'self'"],
				// No 'unsafe-inline' and no 'unsafe-eval': nothing in this project
				// evaluates strings, and the single inline script is hashed above.
				'script-src': ["'self'", ...inlineScriptHashes],
				// Inline styles are still required: GSAP writes element.style
				// directly and the markup carries a few style attributes.
				'style-src': ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com', 'https://fonts.googleapis.com'],
				'font-src': ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
				'img-src': ["'self'", 'data:', 'blob:'],
				'connect-src': ["'self'"],
				'object-src': ["'none'"],
				'base-uri': ["'self'"],
				'frame-ancestors': ["'none'"],
				'form-action': ["'self'"],
				'upgrade-insecure-requests': [],
			},
		},
		// Hostinger terminates TLS at its CDN; a long HSTS max-age is appropriate
		// because the domain is already HTTPS-only with a 301 from http.
		hsts: { maxAge: 31536000, includeSubDomains: true, preload: false },
		// The site loads Font Awesome from cdnjs, which is not CORP-annotated.
		crossOriginEmbedderPolicy: false,
		crossOriginResourcePolicy: { policy: 'cross-origin' },
		referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
	})
);

app.use(compression());

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Hostinger runs `npm run build` on deploy. If that ever fails, the bundle is
// missing and the site falls back to its no-JS baseline — log loudly so the
// cause is visible in the Passenger log instead of being silently degraded.
if (!fs.existsSync(path.join(__dirname, 'public', 'dist', 'app.js'))) {
	console.error('[startup] public/dist/app.js is MISSING — run `npm run build`. Serving no-JS baseline.');
}

// The bundle filenames are not content-hashed, so they must revalidate.
// Everything else under public/ (images, fonts, favicons) is immutable enough
// to cache hard.
app.use(express.static(__dirname + '/public', {
	setHeaders: (res, filePath) => {
		const isVersionlessEntry = /(?:index\.html|app\.js|app\.css|build-manifest\.json)$/.test(filePath);
		const cacheControl = isVersionlessEntry
			? 'no-cache'
			: 'public, max-age=604800, stale-while-revalidate=86400';

		res.setHeader('Cache-Control', cacheControl);
	},
}));

const filePath = path.join(__dirname, 'index.html');
const resumeFilePath = path.join(__dirname, 'private', 'resume.pdf');
const resumeFileName = 'Chirudeva_Reddy_Resume.pdf';

app.get('/', (_req, res) => {
	try {
		const indexHtml = fs.readFileSync(filePath, 'utf8');
		res.send(indexHtml);
	} catch (err) {
		res.status(500).send('Error loading page');
	}
});

app.get('/api/resume', async (req, res) => {
	const rawMode = req.query.mode;
	const requestedMode = typeof rawMode === 'string' ? rawMode : undefined;
	if (rawMode !== undefined && (typeof rawMode !== 'string' || (requestedMode !== 'view' && requestedMode !== 'download'))) {
		return res.status(400).json({
			error: 'Invalid resume mode',
			message: 'The mode must be either view or download.'
		});
	}

	try {
		const { size } = await fs.promises.stat(resumeFilePath);
		const disposition = requestedMode === 'download' ? 'attachment' : 'inline';

		res.status(200).set({
			'Content-Type': 'application/pdf',
			'Content-Disposition': `${disposition}; filename="${resumeFileName}"`,
			'Content-Length': size,
			'Cache-Control': 'public, max-age=86400, must-revalidate'
		});

		const resumeStream = fs.createReadStream(resumeFilePath);
		resumeStream.once('error', (error) => {
			console.error('Resume stream failed', { error, resumeFilePath });
			if (res.headersSent) {
				res.destroy(error);
				return;
			}
			res.status(500).json({
				error: 'Resume unavailable',
				message: 'The requested document could not be retrieved.'
			});
		});
		resumeStream.pipe(res);
	} catch (error) {
		const errorCode = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
		const statusCode = errorCode === 'ENOENT' ? 404 : 500;
		console.error('Resume retrieval failed', { error, resumeFilePath, statusCode });
		return res.status(statusCode).json({
			error: 'Resume unavailable',
			message: 'The requested document could not be retrieved.'
		});
	}
});

// Real 404s. The previous catch-all redirected everything to '/', which meant a
// missing asset returned an HTML page with a 302 — exactly what hid the missing
// vendor module until the browser complained about the MIME type.
const ASSET_PATH = /\.[a-z0-9]+$/i;

app.use((req, res) => {
	if (ASSET_PATH.test(req.path)) {
		return res.status(404).type('txt').send('Not found');
	}

	res.status(404).type('html').send(
		`<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>404 — Page not found | Chirudeva Reddy</title>
<meta name="robots" content="noindex">
<link rel="stylesheet" href="/dist/app.css"></head>
<body class="error-page">
<main class="error-page__inner">
<p class="error-page__code">ERROR 404</p>
<h1 class="error-page__title">This page does not exist.</h1>
<p class="error-page__body">The address may be mistyped, or the page may have moved.</p>
<p class="error-page__action"><a class="btn-aurora" href="/">RETURN HOME &#8599;</a></p>
</main></body></html>`
	);
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
	console.log(`Server listening on http://${HOST}:${PORT}`);
});

export default app;
