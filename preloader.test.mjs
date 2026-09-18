// Runs the real inline bootstrap out of index.html against a stub DOM and a
// virtual clock. The script is CSP-hashed at server startup and cannot be
// imported, so this is the only place its branches get exercised.
//
//   node preloader.test.mjs
import { readFileSync } from 'fs';
import assert from 'assert';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
assert.strictEqual(scripts.length, 1, 'expected exactly one inline script (app.js hashes them for the CSP)');

function makeEl(extra = {}, onAdd) {
	const classes = new Set();
	return {
		classList: {
			add: (c) => {
				classes.add(c);
				if (onAdd) onAdd(c);
			},
			remove: (c) => classes.delete(c),
			contains: (c) => classes.has(c),
		},
		has: (c) => classes.has(c),
		style: {},
		...extra,
	};
}

/** Runs the bootstrap under a virtual clock and returns the observed end state. */
function run({ reduced, runFrames = true }) {
	let now = 0;
	let revealAt = null;
	let revealedByFrames = false;
	const root = makeEl({}, (c) => {
		if (c === 'is-loaded' && revealAt === null) revealAt = now;
	});
	const bar = makeEl();
	const caret = { nodeValue: '00%' };
	const counter = makeEl({ firstChild: caret });
	const offset = makeEl({ textContent: '' });
	const sync = makeEl({ textContent: 'SYNCING' });
	const logLines = [makeEl(), makeEl(), makeEl(), makeEl()];

	const timers = [];
	const frames = [];

	const byId = { 'preloader-counter': counter, 'preloader-offset': offset, 'preloader-sync': sync };
	const document = {
		documentElement: root,
		readyState: 'complete',
		addEventListener: () => {},
		getElementById: (id) => byId[id] || null,
		querySelector: (sel) => (sel === '.preloader__bar' ? bar : null),
		querySelectorAll: (sel) => (sel === '.preloader__log-line' ? logLines : []),
	};
	const window = {
		matchMedia: () => ({ matches: reduced }),
		requestAnimationFrame: (fn) => frames.push(fn),
		setTimeout: (fn, ms) => timers.push({ fn, at: now + ms }),
	};

	new Function('window', 'document', scripts[0])(window, document);

	// Advance a virtual clock at 60fps, firing frames and any timer whose
	// deadline has passed, until nothing is left to run.
	const fireDue = () => {
		for (const t of timers) {
			if (!t.done && t.at <= now) {
				t.done = true;
				t.fn();
			}
		}
	};

	if (runFrames) {
		for (let i = 0; i < 600 && frames.length; i++) {
			frames.shift()(now);
			now += 16.7;
			fireDue();
		}
		// Frames are done; keep the clock running so the post-curve hold timer
		// fires before the 3s failsafe would.
		const beforeFailsafe = timers.filter((t) => !t.done && t.at < 3000);
		for (const t of beforeFailsafe.sort((a, b) => a.at - b.at)) {
			now = Math.max(now, t.at);
			t.done = true;
			t.fn();
		}
	}

	revealedByFrames = revealAt !== null;

	// Fire whatever is still pending (the 3000ms failsafe).
	for (const t of timers.filter((t) => !t.done).sort((a, b) => a.at - b.at)) {
		now = Math.max(now, t.at);
		t.done = true;
		t.fn();
	}

	return {
		loaded: root.has('is-loaded'),
		loadedBeforeFailsafe: revealedByFrames,
		revealAt,
		framesRequested: frames.length,
		logsVisible: logLines.map((l) => l.has('is-visible')),
		sync: sync.textContent,
		syncClass: sync.has('is-synced'),
		counter: caret.nodeValue,
		offset: offset.textContent,
		barTransform: bar.style.transform,
	};
}

// --- prefers-reduced-motion: straight to the page, no sequence at all -------
const reducedRun = run({ reduced: true, runFrames: false });
assert.ok(reducedRun.loaded, 'reduced motion must dismiss the overlay immediately');
assert.strictEqual(reducedRun.framesRequested, 0, 'reduced motion must not schedule any animation frames');
assert.deepStrictEqual(reducedRun.logsVisible, [false, false, false, false], 'reduced motion must not stream logs');

// --- normal motion: full boot sequence, then reveal ------------------------
const full = run({ reduced: false });
assert.ok(full.loadedBeforeFailsafe, 'the rAF curve must dismiss the overlay, not the 3s failsafe');
assert.deepStrictEqual(full.logsVisible, [true, true, true, true], 'every diagnostic line must be revealed');
assert.strictEqual(full.counter, '100%', 'counter must land on 100%');
assert.strictEqual(full.sync, 'IN SYNC', 'git sync badge must settle');
assert.ok(full.syncClass, 'sync badge must stop pulsing via is-synced');
assert.strictEqual(full.barTransform, 'scaleX(1)', 'progress bar must fill');
assert.strictEqual(full.offset, '0x80061000', 'hex offset must walk to its final address');

// The whole reveal, including the 500ms CSS shutter, has to fit the budget.
const SHUTTER_MS = 500;
assert.ok(
	full.revealAt + SHUTTER_MS >= 1200 && full.revealAt + SHUTTER_MS <= 1800,
	`full reveal must land in 1.2-1.8s, got ${Math.round(full.revealAt + SHUTTER_MS)}ms`
);

// --- failsafe: if rAF never fires (throttled/background tab), still dismiss --
const stalled = run({ reduced: false, runFrames: false });
assert.ok(!stalled.loadedBeforeFailsafe, 'without frames nothing should dismiss early');
assert.ok(stalled.loaded, 'the 3s failsafe must dismiss the overlay when rAF never runs');

console.log(`preloader ok — reveal at ${Math.round(full.revealAt + SHUTTER_MS)}ms (budget 1200-1800ms), reduced-motion bypass, failsafe`);
