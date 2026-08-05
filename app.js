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
		"script-src 'self' 'unsafe-inline' https://kit.fontawesome.com; " +
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; " +
		"font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com https://ka-f.fontawesome.com; " +
		"img-src 'self' data: blob:; " +
		"connect-src 'self' https://ka-f.fontawesome.com"
	);
	next();
});

app.use(compression());

const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.static(__dirname + '/public'));
app.use('/gsap', express.static(__dirname + '/node_modules/gsap'));
app.use('/lenis', express.static(__dirname + '/node_modules/lenis'));

const filePath = path.join(__dirname, 'index.html');

app.get('/', (_req, res) => {
	try {
		const indexHtml = fs.readFileSync(filePath, 'utf8');
		res.send(indexHtml);
	} catch (err) {
		res.status(500).send('Error loading page');
	}
});

app.get('*', (req, res) => {
	res.redirect('/');
});

const PORT = process.env.PORT || 3000;
if (process.argv[1] === fileURLToPath(import.meta.url)) {
	app.listen(PORT, () => {
		console.log(`Server listening on http://localhost:${PORT}`);
	});
}

export default app;
