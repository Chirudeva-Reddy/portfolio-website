import express from 'express';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const app = express();

app.disable('x-powered-by');

// Simple CSP suitable for local development with import maps + module scripts
app.use((req, res, next) => {
	res.setHeader('Content-Security-Policy',
		"default-src 'self'; " +
		"script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://kit.fontawesome.com https://unpkg.com; " +
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; " +
		"font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com https://ka-f.fontawesome.com; " +
		"img-src 'self' data: blob:; " +
		"connect-src 'self' https://ka-f.fontawesome.com"
	);
	next();
});

app.use(compression());

const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.static(__dirname + '/public', {
	setHeaders: (res, filePath) => {
		const isVersionlessEntry = /(?:index\.html|styles\.min\.css|scripts\.min\.js)$/.test(filePath);
		const cacheControl = isVersionlessEntry
			? 'no-cache'
			: 'public, max-age=604800, stale-while-revalidate=86400';

		res.setHeader('Cache-Control', cacheControl);
	},
}));
app.use('/gsap', express.static(__dirname + '/node_modules/gsap'));
app.use('/lenis', express.static(__dirname + '/node_modules/lenis'));

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

app.get('*', (req, res) => {
	res.redirect('/');
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
	app.listen(PORT, HOST, () => {
		console.log(`Server listening on http://${HOST}:${PORT}`);
	});
}

export default app;
