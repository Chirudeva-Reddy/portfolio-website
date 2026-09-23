import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { initChat } from './chat.js';

gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {
	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const hasCoarsePointer = window.matchMedia('(hover: none), (pointer: coarse)').matches;
	const motionEnabled = !prefersReducedMotion && !hasCoarsePointer;

	if (!motionEnabled) {
		document.documentElement.classList.add('motion-reduced');
	}

	// ==========================================================================
	// 1. Lenis Smooth Scroll Engine Synced with GSAP Ticker
	// ==========================================================================
	const lenis = motionEnabled ? new Lenis({
		duration: 1.2,
		easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
		orientation: 'vertical',
		gestureOrientation: 'vertical',
		smoothWheel: true,
		wheelMultiplier: 1.0,
		touchMultiplier: 1.5,
		infinite: false,
	}) : null;

	if (lenis) {
		lenis.on('scroll', ScrollTrigger.update);
		gsap.ticker.add((time) => {
			lenis.raf(time * 1000);
		});
		gsap.ticker.lagSmoothing(0);
	}

	// Page-level scroll telemetry stays independent of WebGL so it remains
	// useful on reduced-motion devices and when the 3D canvas is unavailable.
	const pageProgress = document.querySelector('.scroll-progress');
	const pageProgressReadout = pageProgress?.querySelector('.scroll-progress__readout b');
	const pageProgressRemaining = pageProgress?.querySelector('.scroll-progress__readout em');
	let pageProgressFrame = null;

	const renderPageProgress = () => {
		pageProgressFrame = null;
		if (!pageProgress) return;
		const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
		const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
		const percent = Math.round(progress * 100);
		pageProgress.style.setProperty('--page-progress', progress.toFixed(4));
		pageProgress.setAttribute('aria-valuenow', String(percent));
		pageProgress.setAttribute('aria-valuetext', `${percent}% scrolled, ${100 - percent}% remaining`);
		if (pageProgressReadout) pageProgressReadout.textContent = String(percent).padStart(2, '0');
		if (pageProgressRemaining) pageProgressRemaining.textContent = `${100 - percent} LEFT`;
	};

	const schedulePageProgress = () => {
		if (pageProgressFrame !== null) return;
		pageProgressFrame = requestAnimationFrame(renderPageProgress);
	};

	window.addEventListener('scroll', schedulePageProgress, { passive: true });
	window.addEventListener('resize', schedulePageProgress, { passive: true });
	if (lenis) lenis.on('scroll', schedulePageProgress);
	renderPageProgress();

	// ==========================================================================
	// 2. Hero Story: 3D Fin Corridor + Scroll-Driven Steps
	// ==========================================================================
	// A row of tall metal fins recedes along a reflective floor, backlit by a
	// teal wall so light bleeds through the gaps. Scrolling through #hero
	// dollies the camera down the row while the story steps crossfade on top.
	const canvas = document.getElementById('hero-canvas');
	const heroStory = document.getElementById('hero');
	const heroSteps = heroStory ? [...heroStory.querySelectorAll('.hero-step')] : [];
	const heroRailDots = heroStory ? [...heroStory.querySelectorAll('.hero-story__rail li')] : [];
	const storyLive = !prefersReducedMotion && heroSteps.length > 0;
	if (storyLive) heroStory.classList.add('hero-story--live');

	let heroP = 0; // 0 at the top of #hero, 1 when its sticky stage releases
	let heroFade = 1; // 1 while the hero fills the screen, 0 once it has scrolled away

	const renderStory = () => {
		const t = heroP * (heroSteps.length - 1);
		heroSteps.forEach((step, i) => {
			let d = t - i;
			if (i === 0) d = Math.max(0, d);
			if (i === heroSteps.length - 1) d = Math.min(0, d);
			// Fully readable for the middle half of each step, blank between steps
			const o = Math.min(1, Math.max(0, (0.5 - Math.abs(d)) * 4));
			step.style.opacity = o.toFixed(3);
			step.style.transform = `translate3d(0, ${(-d * 80).toFixed(1)}px, 0)`;
			step.inert = o < 0.5;
			if (heroRailDots[i]) heroRailDots[i].classList.toggle('is-active', Math.round(t) === i);
		});
	};

	const onStoryScroll = () => {
		if (!heroStory) return;
		const rect = heroStory.getBoundingClientRect();
		const vh = window.innerHeight;
		heroP = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height - vh)));
		heroFade = Math.min(1, Math.max(0, 1 - (vh - rect.bottom) / (vh * 0.8)));
		// The legibility scrim is viewport-fixed and fades with the corridor, so the hand-off to Metrics has no edge
		heroStory.style.setProperty('--hero-fade', heroFade.toFixed(3));
		if (storyLive) renderStory();
	};

	window.addEventListener('scroll', onStoryScroll, { passive: true });
	window.addEventListener('resize', onStoryScroll);
	if (lenis) lenis.on('scroll', onStoryScroll);
	onStoryScroll();

	if (canvas) {
		try {
			const isSmall = window.innerWidth < 768;
			const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isSmall, powerPreference: 'high-performance' });
			renderer.setPixelRatio(Math.min(window.devicePixelRatio, isSmall ? 1.5 : 2));
			renderer.setSize(window.innerWidth, window.innerHeight);
			renderer.toneMapping = THREE.ACESFilmicToneMapping;
			renderer.toneMappingExposure = 0.95;

			// The scene stays teal while the UI uses amber for interactive priority.
			const BG = new THREE.Color('#030605'); // --color-liquid-deep
			const TEAL = new THREE.Color('#63dac8');
			const scene = new THREE.Scene();
			scene.background = BG;
			scene.fog = new THREE.FogExp2(BG, 0.062);

			const camera = new THREE.PerspectiveCamera(isSmall ? 58 : 42, window.innerWidth / window.innerHeight, 0.1, 120);

			// Corridor layout: fins stand perpendicular to a wall at x = WALL_X,
			// starting near the camera and receding down -z.
			const FIN_COUNT = isSmall ? 40 : 64;
			const FIN_SPACING = 0.85;
			const FIN_DEPTH = 1.3; // how far a fin sticks out of the wall
			const FIN_HEIGHT = 10;
			const WALL_X = 2.6;
			const ROW_START_Z = 6;

			const uniforms = {
				uTime: { value: 0 },
				uScroll: { value: 0 },
				uGlow: { value: TEAL.clone().multiplyScalar(0.6) },
			};

			// One instanced box per fin. The vertex shader bends the front edge into
			// an S-step (recessed below, proud above) whose height rides a slow wave
			// down the row, so the wall "breathes" and shifts as you scroll.
			const finGeometry = new THREE.BoxGeometry(FIN_DEPTH, FIN_HEIGHT, 0.05, 1, 160, 1);
			finGeometry.translate(0, FIN_HEIGHT / 2, 0);
			const finIndex = new Float32Array(FIN_COUNT);
			for (let i = 0; i < FIN_COUNT; i++) finIndex[i] = i / FIN_COUNT;
			finGeometry.setAttribute('aIdx', new THREE.InstancedBufferAttribute(finIndex, 1));

			const finMaterial = new THREE.MeshStandardMaterial({ color: '#020807', metalness: 0.9, roughness: 0.3 });
			// Dims whatever is close to the camera so the nearest fins and wall never
			// blow out; the glow lives in the middle distance, as in a long-lens shot.
			const dimNear = (shader) => {
				shader.vertexShader = shader.vertexShader
					.replace('#include <common>', '#include <common>\nvarying float vViewDepth;')
					.replace('#include <project_vertex>', '#include <project_vertex>\nvViewDepth = -mvPosition.z;');
				shader.fragmentShader = shader.fragmentShader
					.replace('#include <common>', '#include <common>\nvarying float vViewDepth;')
					.replace('#include <opaque_fragment>', 'outgoingLight *= mix(0.22, 1.0, smoothstep(2.0, 14.0, vViewDepth));\n#include <opaque_fragment>');
			};

			finMaterial.onBeforeCompile = (shader) => {
				Object.assign(shader.uniforms, uniforms);
				dimNear(shader);
				shader.vertexShader = shader.vertexShader
					.replace('#include <common>', `#include <common>
						attribute float aIdx;
						uniform float uTime;
						uniform float uScroll;
						varying float vBack;
						varying float vHeight;`)
					.replace('#include <beginnormal_vertex>', `
						float stepY = 1.0 + 2.4 * pow(1.0 - aIdx, 1.6) + sin(uTime * 0.55 - aIdx * 24.0 + uScroll * 7.0) * 0.6 + uScroll * 0.8;
						float stepW = 0.6;
						float su = clamp((position.y - stepY + stepW) / (2.0 * stepW), 0.0, 1.0);
						float stepK = su * su * (3.0 - 2.0 * su);
						float stepSlope = 6.0 * su * (1.0 - su) / (2.0 * stepW);
						float isFront = step(position.x, 0.0);
						float recess = 0.75;
						vec3 objectNormal = vec3(normal);
						if (normal.x < -0.5) objectNormal = normalize(vec3(-1.0, recess * stepSlope, 0.0));
						#ifdef USE_TANGENT
							vec3 objectTangent = vec3(tangent.xyz);
						#endif`)
					.replace('#include <begin_vertex>', `
						vec3 transformed = vec3(position);
						transformed.x += isFront * (1.0 - stepK) * recess;
						vBack = transformed.x / ${FIN_DEPTH.toFixed(2)} + 0.5;
						vHeight = position.y;`);
				shader.fragmentShader = shader.fragmentShader
					.replace('#include <common>', `#include <common>
						uniform vec3 uGlow;
						varying float vBack;
						varying float vHeight;`)
					.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
						// Wall light bleeding onto the fin faces: strongest at the back edge and low down
						float bleed = pow(clamp(vBack, 0.0, 1.0), 3.0) * (0.25 + 0.75 * smoothstep(8.0, 0.5, vHeight));
						totalEmissiveRadiance += uGlow * bleed;`);
			};

			const fins = new THREE.InstancedMesh(finGeometry, finMaterial, FIN_COUNT);
			const finMatrix = new THREE.Matrix4();
			for (let i = 0; i < FIN_COUNT; i++) {
				finMatrix.makeTranslation(WALL_X - FIN_DEPTH / 2, 0, ROW_START_Z - i * FIN_SPACING);
				fins.setMatrixAt(i, finMatrix);
			}
			scene.add(fins);

			// Glowing wall behind the fins: what shows through the gaps
			const wallTexture = (() => {
				const c = document.createElement('canvas');
				c.width = 4;
				c.height = 256;
				const ctx = c.getContext('2d');
				const g = ctx.createLinearGradient(0, 256, 0, 0);
				// Same sea-glass hue as TEAL (#63dac8) so the gaps and the fin bleed match
				g.addColorStop(0, 'rgba(160,236,224,1)');
				g.addColorStop(0.35, 'rgba(99,218,200,0.7)');
				g.addColorStop(0.8, 'rgba(38,110,100,0.18)');
				g.addColorStop(1, 'rgba(5,18,15,0)');
				ctx.fillStyle = g;
				ctx.fillRect(0, 0, 4, 256);
				const tex = new THREE.CanvasTexture(c);
				tex.colorSpace = THREE.SRGBColorSpace;
				return tex;
			})();
			const rowLength = FIN_COUNT * FIN_SPACING + 10;
			const wall = new THREE.Mesh(
				new THREE.PlaneGeometry(rowLength, FIN_HEIGHT),
				new THREE.MeshBasicMaterial({ map: wallTexture, color: new THREE.Color(1.15, 1.15, 1.15), transparent: true }),
			);
			wall.material.onBeforeCompile = dimNear;
			wall.rotation.y = -Math.PI / 2;
			wall.position.set(WALL_X + 0.03, FIN_HEIGHT / 2, ROW_START_Z - rowLength / 2 + 5);
			scene.add(wall);

			// Floor: a real mirror on desktop, dimmed by a translucent film on top;
			// phones get a plain glossy floor to skip the second render pass.
			if (!isSmall) {
				const mirror = new Reflector(new THREE.PlaneGeometry(80, 80), {
					textureWidth: Math.round(window.innerWidth * 0.5),
					textureHeight: Math.round(window.innerHeight * 0.5),
					color: 0x6f7f7c,
				});
				mirror.rotation.x = -Math.PI / 2;
				scene.add(mirror);
			}
			const floorFilm = new THREE.Mesh(
				new THREE.PlaneGeometry(80, 80),
				isSmall
					? new THREE.MeshStandardMaterial({ color: '#031412', metalness: 0.6, roughness: 0.45 })
					: new THREE.MeshBasicMaterial({ color: BG, transparent: true, opacity: 0.72 }),
			);
			floorFilm.rotation.x = -Math.PI / 2;
			floorFilm.position.y = 0.003;
			scene.add(floorFilm);

			// Key light rakes the fin edges from down the corridor; fill keeps faces from going pure black
			const keyLight = new THREE.DirectionalLight('#f5daae', 1.8) // --color-accent-soft: edge highlights echo the amber UI;
			keyLight.position.set(-4, 7, -12);
			scene.add(keyLight);
			scene.add(new THREE.HemisphereLight('#0a2e2b', '#000000', 0.15));
			for (let i = 0; i < 4; i++) {
				const glow = new THREE.PointLight(TEAL, 1.5, 5, 2);
				glow.position.set(WALL_X + 0.2, 0.4, ROW_START_Z - 1 - i * 5);
				scene.add(glow);
			}

			const composer = new EffectComposer(renderer);
			composer.addPass(new RenderPass(scene, camera));
			const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2), 0.55, 0.5, 0.55);
			composer.addPass(bloom);
			composer.addPass(new OutputPass());

			// Camera path keyed to story progress: look down the row, swing toward
			// the fins mid-story, then glide deeper down the corridor.
			const CAMERA_KEYS = [
				{ p: 0, pos: [-3.2, 1.1, 11], look: [0.8, 2.2, -6] },
				{ p: 0.5, pos: [-1.6, 2.2, 3.5], look: [2.6, 1.6, -4] },
				{ p: 1, pos: [-2.8, 1.5, -6], look: [1.2, 2.4, -24] },
			];
			const camPos = new THREE.Vector3();
			const camLook = new THREE.Vector3();
			const targetPos = new THREE.Vector3();
			const targetLook = new THREE.Vector3();
			const keyAt = (p) => {
				let k = 0;
				while (k < CAMERA_KEYS.length - 2 && p > CAMERA_KEYS[k + 1].p) k++;
				const a = CAMERA_KEYS[k];
				const b = CAMERA_KEYS[k + 1];
				let t = Math.min(1, Math.max(0, (p - a.p) / (b.p - a.p)));
				t = t * t * (3 - 2 * t);
				targetPos.set(...a.pos).lerp(new THREE.Vector3(...b.pos), t);
				targetLook.set(...a.look).lerp(new THREE.Vector3(...b.look), t);
			};
			keyAt(0);
			camPos.copy(targetPos);
			camLook.copy(targetLook);

			let pointerX = 0;
			let pointerY = 0;
			window.addEventListener('pointermove', (e) => {
				pointerX = (e.clientX / window.innerWidth) * 2 - 1;
				pointerY = (e.clientY / window.innerHeight) * 2 - 1;
			}, { passive: true });

			window.addEventListener('resize', () => {
				camera.aspect = window.innerWidth / window.innerHeight;
				camera.updateProjectionMatrix();
				renderer.setSize(window.innerWidth, window.innerHeight);
				composer.setSize(window.innerWidth, window.innerHeight);
			});

			const clockStart = performance.now();
			let rafId = null;
			const renderCorridor = () => {
				if (document.hidden) {
					rafId = null;
					return;
				}
				rafId = requestAnimationFrame(renderCorridor);

				const p = prefersReducedMotion ? 0 : heroP;
				if (!prefersReducedMotion) uniforms.uTime.value = (performance.now() - clockStart) / 1000;
				uniforms.uScroll.value += (p - uniforms.uScroll.value) * 0.08;

				keyAt(p);
				targetPos.x += pointerX * 0.35;
				targetPos.y -= pointerY * 0.2;
				camPos.lerp(targetPos, 0.07);
				camLook.lerp(targetLook, 0.07);
				camera.position.copy(camPos);
				camera.lookAt(camLook);

				// Past the hero the corridor recedes into a dim backdrop for the rest of the page
				canvas.style.opacity = (0.1 + 0.9 * heroFade).toFixed(3);
				if (heroFade > 0.02) composer.render();
				else renderer.render(scene, camera);
			};

			document.addEventListener('visibilitychange', () => {
				if (!document.hidden && rafId === null) renderCorridor();
			});
			renderCorridor();
		} catch (err) {
			console.warn('Hero corridor initialization skipped:', err);
		}
	}

	// ==========================================================================
	// 3. High-Precision Computer Vision Spatial Reticle Cursor
	// ==========================================================================
	const cvCursor = document.getElementById('cv-cursor');
	const cvReticle = document.getElementById('cv-reticle');
	const cvTelemetry = document.getElementById('cv-telemetry');
	const cvCoordX = document.getElementById('cv-coord-x');
	const cvCoordY = document.getElementById('cv-coord-y');
	const cvStatus = document.getElementById('cv-status');

	let mouseX = window.innerWidth / 2;
	let mouseY = window.innerHeight / 2;
	let targetMouseX = mouseX;
	let targetMouseY = mouseY;
	let magneticTarget = null;

	const renderCvCursor = () => {
		mouseX += (targetMouseX - mouseX) * 0.22;
		mouseY += (targetMouseY - mouseY) * 0.22;

		if (cvReticle) {
			const reticleX = magneticTarget ? magneticTarget.x : mouseX;
			const reticleY = magneticTarget ? magneticTarget.y : mouseY;
			cvReticle.style.transform = `translate3d(${reticleX}px, ${reticleY}px, 0) translate(-50%, -50%)`;
		}

		if (cvTelemetry) {
			cvTelemetry.style.transform = `translate3d(${mouseX + 16}px, ${mouseY + 14}px, 0)`;
			if (cvCoordX && cvCoordY) {
				cvCoordX.textContent = Math.round(targetMouseX).toString().padStart(4, '0');
				cvCoordY.textContent = Math.round(targetMouseY).toString().padStart(4, '0');
			}
		}

		requestAnimationFrame(renderCvCursor);
	};

	// Touch devices get no reticle at all: a tap emits pointermove, which used to
	// strand the crosshair at the tap point and leave the rAF loop running.
	if (cvCursor && cvReticle && !hasCoarsePointer) {
		window.addEventListener('pointermove', (e) => {
			// `js-cursor` is what actually hides the native arrow. Setting it here,
			// on real pointer movement, means a failed bundle never leaves the page
			// with no visible cursor at all.
			document.documentElement.classList.add('js-cursor');
			document.body.classList.add('cursor-active');
			targetMouseX = e.clientX;
			targetMouseY = e.clientY;
		}, { passive: true });

		document.addEventListener('mouseleave', () => {
			document.body.classList.remove('cursor-active');
		});

		window.addEventListener('pointerdown', () => {
			document.body.classList.add('cursor-click');
			if (cvStatus) cvStatus.textContent = 'SYS // CINCH';
		});

		window.addEventListener('pointerup', () => {
			document.body.classList.remove('cursor-click');
			if (cvStatus && !magneticTarget) cvStatus.textContent = 'CV // TRACKING';
		});

		requestAnimationFrame(renderCvCursor);

		const interactiveEls = document.querySelectorAll('a, button, [data-magnetic="true"], [data-cursor-text], .matrix-card, .timeline-card, .bento-box-tall-highlight, .bento-box-wide, .bento-box-small, .surface-card, .about-portrait-card, .project-modal__backdrop, .project-modal__close');
		interactiveEls.forEach((el) => {
			el.addEventListener('pointerenter', () => {
				document.body.classList.add('cursor-hover');
				const rect = el.getBoundingClientRect();
				if (el.classList.contains('magnetic') || el.getAttribute('data-magnetic') === 'true') {
					magneticTarget = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
				}
				if (cvStatus) {
					const text = el.getAttribute('data-cursor-text') || 'TARGET';
					cvStatus.textContent = `LOCK // ${text.toUpperCase()}`;
				}
			});

			el.addEventListener('pointerleave', () => {
				document.body.classList.remove('cursor-hover');
				magneticTarget = null;
				if (cvStatus) {
					cvStatus.textContent = 'CV // TRACKING';
				}
			});
		});
	}

	// ==========================================================================
	// 4. Preloader Terminal Counter & Entrance Stagger
	// ==========================================================================
	// The overlay is dismissed by the inline bootstrap script in index.html
	// (root class `is-loaded`), which runs even if this bundle never does.
	// When the bundle is here in time, it arms a diagonal shatter in place of
	// the CSS shutter: the loading screen cracks along a diagonal, the two
	// halves press together, part to show the corridor behind, then burst
	// apart as the hero lands.
	const preloader = document.getElementById('preloader');
	const root = document.documentElement;

	if (preloader && !prefersReducedMotion) {
		let entranceStarted = false;
		const runHeroEntrance = (delay = 0) => {
			if (entranceStarted) return;
			entranceStarted = true;
			ScrollTrigger.refresh();
			if (motionEnabled) {
				gsap.fromTo('.hero-step[data-step="0"] > *', { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, delay, stagger: 0.12, ease: 'power3.out', clearProps: 'all' });
			}
		};

		// The cut runs from 60% along the top edge to 40% along the bottom.
		// Each half leaves along the cut's normal, so they separate cleanly.
		const CUT_TOP = 60;
		const CUT_BOTTOM = 40;

		const shatter = () => {
			const content = preloader.querySelector('.preloader__content');
			const vw = window.innerWidth;
			const vh = window.innerHeight;
			// Unit normal to the cut in screen pixels (points right and down)
			const dx = ((CUT_BOTTOM - CUT_TOP) / 100) * vw;
			const len = Math.hypot(dx, vh);
			const nx = vh / len;
			const ny = -dx / len;

			const makeShard = (polygon) => {
				const shard = document.createElement('div');
				shard.className = 'preloader-shard';
				shard.setAttribute('aria-hidden', 'true');
				shard.style.clipPath = `polygon(${polygon})`;
				const copy = content.cloneNode(true);
				copy.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
				shard.appendChild(copy);
				document.body.appendChild(shard);
				return shard;
			};
			const left = makeShard(`0 0, ${CUT_TOP}% 0, ${CUT_BOTTOM}% 100%, 0 100%`);
			const right = makeShard(`${CUT_TOP}% 0, 100% 0, 100% 100%, ${CUT_BOTTOM}% 100%`);

			const crack = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
			crack.setAttribute('class', 'preloader-crack');
			// Pixel-space viewBox: a scaled one would force non-scaling-stroke,
			// which breaks pathLength dashing and draws the crack as dashes.
			crack.setAttribute('viewBox', `0 0 ${vw} ${vh}`);
			crack.setAttribute('aria-hidden', 'true');
			crack.innerHTML = `<line x1="${(CUT_TOP / 100) * vw}" y1="0" x2="${(CUT_BOTTOM / 100) * vw}" y2="${vh}" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>`;
			document.body.appendChild(crack);
			const line = crack.querySelector('line');

			// Shards now cover the screen pixel-for-pixel; retire the original.
			preloader.style.display = 'none';

			const cleanup = () => {
				left.remove();
				right.remove();
				crack.remove();
			};

			const along = (dist) => ({ x: nx * dist, y: ny * dist });
			const burst = Math.max(vw, vh) * 0.75;

			gsap.timeline({ onComplete: cleanup })
				// 1. Anticipation: the crack draws top to bottom while the halves
				//    press into it, as if under load.
				.to(line, { strokeDashoffset: 0, duration: 0.42, ease: 'power2.in' }, 0)
				.to(left, { ...along(5), duration: 0.42, ease: 'power2.in' }, 0)
				.to(right, { ...along(-5), duration: 0.42, ease: 'power2.in' }, 0)
				// 2. Release: they spring a narrow gap open and hold for a beat,
				//    so the corridor glows through before the reveal.
				.to(left, { ...along(-14), rotation: -0.6, duration: 0.24, ease: 'back.out(2.5)' }, 0.42)
				.to(right, { ...along(14), rotation: 0.6, duration: 0.24, ease: 'back.out(2.5)' }, 0.42)
				.to(line, { opacity: 0, duration: 0.3 }, 0.5)
				// 3. Burst: both halves fly out along the normal, turning away.
				.to(left, { ...along(-burst), rotation: -7, duration: 0.85, ease: 'power4.in' }, 0.78)
				.to(right, { ...along(burst), rotation: 7, duration: 0.85, ease: 'power4.in' }, 0.78);

			runHeroEntrance(1.15);
		};

		if (root.classList.contains('is-loaded')) {
			// The bundle arrived after the CSS shutter already ran.
			runHeroEntrance();
		} else {
			root.classList.add('shatter-armed');
			const observer = new MutationObserver(() => {
				if (!root.classList.contains('is-loaded')) return;
				observer.disconnect();
				try {
					shatter();
				} catch (err) {
					// Never leave the overlay up: fall back to hiding it outright.
					console.warn('Preloader shatter skipped:', err);
					preloader.style.display = 'none';
					runHeroEntrance();
				}
			});
			observer.observe(root, { attributes: true, attributeFilter: ['class'] });
			window.addEventListener('load', () => window.setTimeout(() => runHeroEntrance(), 3500), { once: true });
		}
	} else if (preloader) {
		preloader.classList.add('preloader--loaded');
		ScrollTrigger.refresh();
	}

	// Late-loading webfonts change element heights, which is the usual reason a
	// ScrollTrigger start position ends up measured against a stale layout.
	if (document.fonts && document.fonts.ready) {
		document.fonts.ready.then(() => ScrollTrigger.refresh());
	}

	// Anti-stranding guard. Scroll reveals set opacity to 0 up front, so any
	// failure to fire leaves content permanently invisible. If an element has
	// scrolled into view and is still fully transparent, drop the inline styles
	// so the content wins over the animation.
	// Matrix cards are left out: their reveal is scrubbed to scroll position, so
	// they can't strand, and they are legitimately transparent mid-flight.
	const revealTargets = document.querySelectorAll(
		'.bento-box-tall-highlight, .bento-box-wide, .bento-box-small, .timeline-card, .about-portrait-card'
	);

	let guardScheduled = false;
	const unstrandVisibleContent = () => {
		guardScheduled = false;
		revealTargets.forEach((el) => {
			const rect = el.getBoundingClientRect();
			const hasEnteredViewport = rect.top < window.innerHeight && rect.bottom > 0;
			if (hasEnteredViewport && Number(getComputedStyle(el).opacity) === 0) {
				gsap.set(el, { clearProps: 'all' });
			}
		});
	};

	const scheduleGuard = () => {
		if (guardScheduled) return;
		guardScheduled = true;
		requestAnimationFrame(unstrandVisibleContent);
	};

	window.addEventListener('scroll', scheduleGuard, { passive: true });
	window.addEventListener('resize', scheduleGuard, { passive: true });
	window.addEventListener('load', () => window.setTimeout(unstrandVisibleContent, 1200), { once: true });

	// ==========================================================================
	// 4b. Mobile Navigation Panel
	// ==========================================================================
	const menuToggle = document.getElementById('menu-toggle');
	const mobileMenu = document.getElementById('mobile-menu');

	const closeMobileMenu = ({ restoreFocus = true } = {}) => {
		if (!menuToggle || !mobileMenu || menuToggle.getAttribute('aria-expanded') !== 'true') return;

		menuToggle.setAttribute('aria-expanded', 'false');
		menuToggle.setAttribute('aria-label', 'Open navigation menu');
		mobileMenu.classList.remove('is-open');
		document.body.classList.remove('menu-open');

		// Wait for the fade-out before removing it from the a11y tree.
		window.setTimeout(() => {
			if (menuToggle.getAttribute('aria-expanded') !== 'true') mobileMenu.hidden = true;
		}, 280);

		if (restoreFocus) menuToggle.focus();
	};

	const openMobileMenu = () => {
		if (!menuToggle || !mobileMenu) return;

		mobileMenu.hidden = false;
		// Force a reflow so the opening transition actually runs.
		void mobileMenu.offsetWidth;
		menuToggle.setAttribute('aria-expanded', 'true');
		menuToggle.setAttribute('aria-label', 'Close navigation menu');
		mobileMenu.classList.add('is-open');
		document.body.classList.add('menu-open');
	};

	if (menuToggle && mobileMenu) {
		menuToggle.addEventListener('click', () => {
			const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
			if (isOpen) closeMobileMenu();
			else openMobileMenu();
		});

		// Any navigation choice closes the panel.
		mobileMenu.querySelectorAll('a[href]').forEach((link) => {
			link.addEventListener('click', () => closeMobileMenu({ restoreFocus: false }));
		});

		document.addEventListener('keydown', (event) => {
			if (event.key === 'Escape') closeMobileMenu();
		});

		// Keep focus inside the panel while it is open.
		mobileMenu.addEventListener('keydown', (event) => {
			if (event.key !== 'Tab') return;
			const focusable = [menuToggle, ...mobileMenu.querySelectorAll('a[href], button')];
			const first = focusable[0];
			const last = focusable[focusable.length - 1];

			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		});

		// Returning to a desktop width must not strand an open overlay.
		window.matchMedia('(min-width: 769px)').addEventListener('change', (event) => {
			if (event.matches) closeMobileMenu({ restoreFocus: false });
		});
	}

	// ==========================================================================
	// 5. Navigation Smooth Anchors & ScrollSpy
	// ==========================================================================
	// Every in-page anchor, not just the desktop nav — the brand logo, the
	// footer discipline links and the mobile panel all need this, because Lenis
	// suppresses native anchor scrolling.
	initChat({
		scrollTo: (id) => (lenis ? lenis.scrollTo(`#${id}`, { duration: 1.2, offset: -80 }) : document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })),
	});

	const navLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');
	navLinks.forEach((link) => {
		link.addEventListener('click', (e) => {
			const targetId = link.getAttribute('href');
			if (!targetId || targetId === '#') return;
			e.preventDefault();

			if (lenis) {
				lenis.scrollTo(targetId, { duration: 1.2, offset: -80 });
			} else {
				document.querySelector(targetId)?.scrollIntoView({ behavior: 'smooth' });
			}
		});
	});

	// Scroll-spy marks only the two real navigations — not the brand link or the
	// footer's topic links, which happen to share the same hrefs.
	const spyLinks = document.querySelectorAll('.site-header__nav a[href^="#"], .mobile-menu__link[href^="#"]');

	if (motionEnabled) {
		const trackedSections = ['hero', 'metrics', 'research', 'matrix', 'projects', 'experience'];
		trackedSections.forEach((id) => {
			const sec = document.getElementById(id);
			if (!sec) return;
			ScrollTrigger.create({
				trigger: sec,
				start: 'top 45%',
				end: 'bottom 45%',
				onToggle: (self) => {
					if (self.isActive) {
						spyLinks.forEach((a) => {
							const href = a.getAttribute('href')?.replace('#', '');
							a.classList.toggle('active', href === id);
						});
					}
				}
			});
		});
	}

	// Honour a deep link once Lenis owns the scroll position. Native fragment
	// scrolling does not survive smooth-scroll initialisation.
	const initialHash = window.location.hash;
	if (initialHash && initialHash.length > 1) {
		const target = document.querySelector(initialHash);
		if (target) {
			window.setTimeout(() => {
				if (lenis) lenis.scrollTo(initialHash, { offset: -80, immediate: true });
				else target.scrollIntoView();
			}, 100);
		}
	}

	// ==========================================================================
	// 6. Interactive 3D Perspective Card Tilt
	// ==========================================================================
	if (motionEnabled) {
		const tiltCards = document.querySelectorAll('.matrix-card, .timeline-card, .surface-card, .bento-box-tall-highlight, .bento-box-wide, .bento-box-small, .about-portrait-frame');
		tiltCards.forEach((card) => {
			card.addEventListener('mousemove', (e) => {
				const rect = card.getBoundingClientRect();
				const x = e.clientX - rect.left - rect.width / 2;
				const y = e.clientY - rect.top - rect.height / 2;
				const rotateX = (y / (rect.height / 2)) * -4;
				const rotateY = (x / (rect.width / 2)) * 4;
				card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(4px)`;
			});

			card.addEventListener('mouseleave', () => {
				card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
				card.style.transition = 'transform 0.4s ease';
			});

			card.addEventListener('mouseenter', () => {
				card.style.transition = 'none';
			});
		});
	}

	// ==========================================================================
	// 7. Scroll-Reveal Timeline Animations
	// ==========================================================================
	if (motionEnabled) {
		// Bento boxes metrics reveal
		const bentoBoxes = document.querySelectorAll('.bento-box-tall-highlight, .bento-box-wide, .bento-box-small');
		if (bentoBoxes.length > 0) {
			gsap.fromTo(
				bentoBoxes,
				{ opacity: 0, y: 30, scale: 0.96 },
				{
					opacity: 1,
					y: 0,
					scale: 1,
					duration: 0.75,
					stagger: 0.1,
					ease: 'power3.out',
					scrollTrigger: {
						trigger: '.bento-metrics-grid',
						start: 'top 85%',
						toggleActions: 'play none none none'
					}
				}
			);
		}

		// Technical Matrix: the orbit assembles as it scrolls in. Side cards fly in
		// from beyond their own screen edge, tilted toward the viewer; the focal
		// card rises out of depth and the ring contracts around it. Scrubbed, so
		// it rewinds on the way back up. #smooth-wrapper clips the off-screen start.
		const matrixStage = document.querySelector('.matrix-orbital-stage');
		if (matrixStage) {
			const vw = () => window.innerWidth;
			const vh = () => window.innerHeight;
			const matrixTl = gsap.timeline({
				defaults: { ease: 'power2.out', duration: 1 },
				scrollTrigger: {
					trigger: matrixStage,
					start: 'top bottom',
					end: 'center 55%', // locks together as the orbit reaches mid-screen
					scrub: 0.9,
					invalidateOnRefresh: true,
				},
			});

			// [cards, start offset per card index]: left/right columns fan in from the
			// top, side and bottom of their edge; the bottom row rises from the corners
			const flights = [
				['.matrix-side-col--left .matrix-card', (i) => ({ x: -vw() * 0.7, y: (i - 1) * vh() * 0.35, rotationY: 38 })],
				['.matrix-side-col--right .matrix-card', (i) => ({ x: vw() * 0.7, y: (i - 1) * vh() * 0.35, rotationY: -38 })],
				['.matrix-bottom-row .matrix-card', (i) => ({ x: (i === 0 ? -1 : 1) * vw() * 0.4, y: vh() * 0.55, rotationX: -30 })],
			];
			flights.forEach(([selector, from]) => {
				document.querySelectorAll(selector).forEach((card, i) => {
					matrixTl.fromTo(
						card,
						{ x: () => from(i).x, y: () => from(i).y, z: 240, rotationX: () => from(i).rotationX || 0, rotationY: () => from(i).rotationY || 0, opacity: 0, transformPerspective: 1200 },
						{ x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, opacity: 1 },
						0.08 * i,
					);
				});
			});

			const featured = matrixStage.querySelector('.matrix-card--featured');
			if (featured) {
				matrixTl.fromTo(featured,
					{ z: -900, scale: 0.6, rotationX: 28, opacity: 0, transformPerspective: 1200 },
					{ z: 0, scale: 1, rotationX: 0, opacity: 1, duration: 1.1 },
					0.1);
			}

			// The ring already spins via a CSS transform animation, so size it through
			// its own `scale` property (a CSS variable) instead of fighting that transform
			const ring = matrixStage.querySelector('.matrix-orbit-ring');
			if (ring) {
				matrixTl.fromTo(ring, { '--ring-scale': 1.9, opacity: 0 }, { '--ring-scale': 1, opacity: 1, duration: 1.1 }, 0);
			}

			const capabilitiesBar = document.querySelector('.matrix-capabilities-bar');
			if (capabilitiesBar) {
				matrixTl.fromTo(capabilitiesBar, { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 0.5);
			}
		}

		// Experience: on desktop, a pinned diagonal gallery. Cards sit on a
		// descending staircase (CSS, via --i); vertical scroll translates the row
		// left and up by the same slope, so the path runs along the diagonal and the
		// card in focus always lands in the same spot. Elsewhere the cards are a
		// swipeable row or a grid, and just fade up as they enter.
		const experienceSection = document.getElementById('experience');
		const experiencePin = experienceSection?.querySelector('.experience-pin');
		const experienceTrack = experienceSection?.querySelector('.timeline-stack');
		const timelineCards = experienceTrack ? [...experienceTrack.querySelectorAll('.timeline-card')] : [];
		const experienceCounter = experienceSection?.querySelector('.experience-counter');
		timelineCards.forEach((card, i) => card.style.setProperty('--i', i));

		const revealTimelineCards = () => timelineCards.map((card) => gsap.fromTo(
			card,
			{ opacity: 0, y: 35 },
			{
				opacity: 1,
				y: 0,
				duration: 0.75,
				ease: 'power3.out',
				scrollTrigger: { trigger: card, start: 'top 85%', toggleActions: 'play none none none' },
			}
		));

		const mm = gsap.matchMedia();
		mm.add('(min-width: 1025px)', () => {
			if (!experiencePin || timelineCards.length < 2) {
				revealTimelineCards();
				return undefined;
			}
			experienceSection.classList.add('is-live');
			const stair = () => parseFloat(getComputedStyle(experienceTrack).getPropertyValue('--stair')) || 0;
			// Exactly one card pitch per step, so step k parks card k where card 0
			// started. That keeps the highlighted card and the staircase rise in sync;
			// sizing travel to the row's overflow instead let the current card slide
			// off-screen while later ones were still in view.
			const travelX = () => timelineCards[timelineCards.length - 1].offsetLeft - timelineCards[0].offsetLeft;
			const setCurrent = (progress) => {
				const current = Math.round(progress * (timelineCards.length - 1));
				timelineCards.forEach((card, i) => card.classList.toggle('is-current', i === current));
				if (experienceCounter) {
					experienceCounter.querySelector('span').textContent = String(current + 1).padStart(2, '0');
					experienceCounter.style.setProperty('--exp-progress', progress.toFixed(3));
				}
			};
			setCurrent(0);

			gsap.to(experienceTrack, {
				x: () => -travelX(),
				y: () => -stair() * (timelineCards.length - 1),
				ease: 'none',
				scrollTrigger: {
					trigger: experiencePin,
					pin: true,
					start: 'top top',
					end: () => '+=' + Math.round(travelX() * 1.15), // a little extra dwell per card
					scrub: 0.6,
					invalidateOnRefresh: true,
					onUpdate: (self) => setCurrent(self.progress),
				},
			});

			return () => {
				experienceSection.classList.remove('is-live');
				timelineCards.forEach((card) => card.classList.remove('is-current'));
			};
		});
		mm.add('(max-width: 1024px)', () => {
			revealTimelineCards();
		});
	}

	// ==========================================================================
	// 8. Project Detail Modal Dialog Logic
	// ==========================================================================
	const projectModal = document.getElementById('project-modal');
	const modalTitle = document.getElementById('modal-title');
	const modalCategory = document.getElementById('modal-category');
	const modalDescription = document.getElementById('modal-desc');
	const modalIndex = document.getElementById('modal-index');
	const modalDiagram = document.getElementById('modal-diagram');
	const modalGithub = document.getElementById('modal-github');
	const modalDemo = document.getElementById('modal-demo');
	const modalClose = document.getElementById('modal-close');
	const modalBackdrop = document.getElementById('modal-backdrop');
	const modalPanel = projectModal?.querySelector('.project-modal__panel');
	const pageContent = document.getElementById('smooth-content');
	const projectCardsList = document.querySelectorAll('.project-item-card');
	// Focus returns to whatever opened the dialog, not to the card element.
	let lastFocusedTrigger = null;

	const openProjectModal = (card) => {
		if (!projectModal || !modalTitle || !modalCategory || !modalDescription || !modalIndex) return;
		if (!lastFocusedTrigger) lastFocusedTrigger = card.querySelector('[data-open-project]') || card;
		const rawTitle = card.querySelector('.project-item-title')?.cloneNode(true);
		rawTitle?.querySelectorAll('.sr-only, .project-item-title__arrow')?.forEach((el) => el.remove());
		modalTitle.textContent = rawTitle?.textContent.trim() || 'Project';
		modalCategory.textContent = card.querySelector('.project-category-tag')?.textContent || 'Project';
		modalDescription.textContent = card.querySelector('.project-item-desc')?.textContent || '';
		modalIndex.textContent = card.querySelector('.project-dates')?.textContent || '';

		const diagram = card.querySelector('.project-diagram');
		if (modalDiagram && diagram) {
			modalDiagram.src = diagram.src;
			modalDiagram.alt = diagram.alt;
		}

		const liveUrl = card.getAttribute('data-live');
		if (modalDemo) {
			if (liveUrl) {
				modalDemo.setAttribute('href', liveUrl);
				modalDemo.style.display = 'inline-flex';
				modalGithub?.classList.remove('btn-aurora');
				modalGithub?.classList.add('btn-kelp');
			} else {
				modalDemo.style.display = 'none';
				modalGithub?.classList.remove('btn-kelp');
				modalGithub?.classList.add('btn-aurora');
			}
		}

		if (modalGithub) {
			const githubUrl = card.getAttribute('data-github') || 'https://github.com/Chirudeva-Reddy';
			modalGithub.setAttribute('href', githubUrl);
		}

		projectModal.removeAttribute('inert');
		projectModal.classList.add('is-open');
		projectModal.setAttribute('aria-hidden', 'false');
		pageContent?.setAttribute('inert', '');
		document.body.classList.add('modal-open');
		if (lenis) lenis.stop();
		modalPanel?.scrollTo(0, 0);
		modalPanel?.focus({ preventScroll: true });
	};

	const closeProjectModal = () => {
		if (!projectModal) return;
		projectModal.classList.remove('is-open');
		projectModal.setAttribute('aria-hidden', 'true');
		// opacity:0 alone leaves the closed dialog's controls in the tab order.
		projectModal.setAttribute('inert', '');
		pageContent?.removeAttribute('inert');
		document.body.classList.remove('modal-open');
		if (lenis) lenis.start();
		lastFocusedTrigger?.focus();
		lastFocusedTrigger = null;
	};

	projectCardsList.forEach((card) => {
		card.querySelector('[data-open-project]')?.addEventListener('click', (event) => {
			lastFocusedTrigger = event.currentTarget;
			openProjectModal(card);
		});
	});

	modalClose?.addEventListener('click', closeProjectModal);
	modalBackdrop?.addEventListener('click', closeProjectModal);

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && projectModal?.classList.contains('is-open')) closeProjectModal();
	});

	projectModal?.addEventListener('keydown', (event) => {
		if (event.key !== 'Tab') return;
		const focusable = Array.from(projectModal.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])')).filter((el) => !el.hasAttribute('disabled'));
		if (focusable.length === 0) return;
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		// The panel itself takes focus on open, so Shift+Tab from it must wrap too.
		if (event.shiftKey && (document.activeElement === first || document.activeElement === modalPanel)) {
			event.preventDefault();
			last.focus();
		}
		if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	});

	// ==========================================================================
	// 8b. Projects Index: the sticky diagram well follows the active row
	// ==========================================================================
	// CSS only shows the well above 1024px without reduced motion; everywhere
	// else rows keep their inline diagrams, so this wiring is inert there.
	const projectsIndex = document.querySelector('.projects-index');
	const viewerImages = projectsIndex ? projectsIndex.querySelectorAll('.projects-viewer__img') : [];

	if (projectsIndex && viewerImages.length && projectCardsList.length) {
		const enhancedLayout = window.matchMedia('(min-width: 1025px) and (prefers-reduced-motion: no-preference)');
		const projectFigures = projectsIndex.querySelectorAll('.project-figure');
		let bandCard = null;
		let focusLocked = false;

		const setActiveProject = (card) => {
			const index = card.getAttribute('data-project');
			projectCardsList.forEach((row) => row.toggleAttribute('data-active', row === card));
			viewerImages.forEach((img) => img.classList.toggle('is-active', img.getAttribute('data-project') === index));
		};

		// Keyboard focus beats scroll position, until focus leaves the index or the
		// pointer takes over again (a wheel after Escape must not stay frozen).
		projectCardsList.forEach((card) => {
			card.addEventListener('focusin', (event) => {
				focusLocked = event.target.matches(':focus-visible');
				setActiveProject(card);
			});
		});

		const releaseFocusLock = () => {
			if (!focusLocked) return;
			focusLocked = false;
			if (bandCard) setActiveProject(bandCard);
		};
		projectsIndex.addEventListener('focusout', (event) => {
			if (!projectsIndex.contains(event.relatedTarget)) releaseFocusLock();
		});
		// keydown covers PageDown/arrows/Home/End; Tab re-locks via focusin right after.
		['wheel', 'pointerdown', 'touchstart', 'keydown'].forEach((type) => window.addEventListener(type, releaseFocusLock, { passive: true }));

		// A thin band just above the viewport centre, level with the pinned well.
		const rowObserver = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (!entry.isIntersecting) return;
				bandCard = entry.target;
				if (!focusLocked) setActiveProject(bandCard);
			});
		}, { rootMargin: '-40% 0px -55% 0px' });
		projectCardsList.forEach((card) => rowObserver.observe(card));

		// The pan frames are keyboard stops only while they are actually on screen.
		const syncProjectFigures = () => {
			projectFigures.forEach((figure) => {
				if (enhancedLayout.matches) figure.removeAttribute('tabindex');
				else figure.setAttribute('tabindex', '0');
			});
		};

		projectsIndex.classList.add('is-enhanced');
		syncProjectFigures();
		// The enhanced layout is ~1600px shorter than the one earlier triggers measured.
		if (enhancedLayout.matches) ScrollTrigger.refresh();
		enhancedLayout.addEventListener('change', () => {
			syncProjectFigures();
			ScrollTrigger.refresh();
		});
	}

	// ==========================================================================
	// 9. Footer Reveal
	// ==========================================================================
	// As the footer arrives, each line rises out of its mask in reading order
	// (nav, then contact), the rule draws across, and the CDR monogram forms
	// from a single point (below). Plays back in reverse when you
	// scroll away, so the reveal runs again on the next approach.
	const siteFooter = document.querySelector('.site-footer');
	if (siteFooter && motionEnabled) {
		const navLines = siteFooter.querySelectorAll('.site-footer__nav [data-reveal]');
		const infoLines = siteFooter.querySelectorAll('.site-footer__contact [data-reveal]');
		const rule = siteFooter.querySelector('.site-footer__rule');
		const mark = siteFooter.querySelector('.site-footer__cdr');
		const nameEl = siteFooter.querySelector('.site-footer__name');

		gsap.timeline({
			defaults: { ease: 'expo.out', duration: 1.1 },
			scrollTrigger: {
				trigger: siteFooter,
				start: 'top 72%',
				toggleActions: 'play none none reverse',
			},
		})
			.fromTo(navLines, { yPercent: 125 }, { yPercent: 0, stagger: 0.045 }, 0)
			.fromTo(infoLines, { yPercent: 125 }, { yPercent: 0, stagger: 0.025 }, 0.25)
			.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: 'power3.inOut' }, 0.3);

		// Monogram formation: a seed dot appears at the centre, stretches into a
		// horizon line out to both edges, and each letter then draws itself
		// along its own stroke from that line: ( and C from the left end,
		// R and ) from the right, D last in the middle. The line fades as the
		// letters take over, then the name rises in letter by letter.
		if (mark && nameEl) {
			const seed = mark.querySelector('.cdr-seed');
			const horizon = mark.querySelector('.cdr-horizon');
			const letters = [...mark.querySelectorAll('.cdr-letter')];
			letters.forEach((path) => {
				const len = path.getTotalLength();
				// Gap and offset run a few units past the length so no stroke cap
				// peeks out at the path's start before it draws.
				path.style.strokeDasharray = `${len} ${len + 20}`;
				path.dataset.len = len + 10;
			});
			nameEl.innerHTML = [...nameEl.textContent].map((ch) => `<span>${ch === ' ' ? '&nbsp;' : ch}</span>`).join('');
			const nameLetters = nameEl.querySelectorAll('span');
			const bySide = (side) => letters.filter((p) => p.dataset.side === side);
			const draw = { strokeDashoffset: 0, duration: 1.1, ease: 'power3.inOut' };
			const undrawn = (p) => ({ strokeDashoffset: Number(p.dataset.len) });

			const formTl = gsap.timeline({
				paused: true,
				defaults: { ease: 'power3.out' },
			})
				.fromTo(seed, { attr: { r: 0 }, opacity: 1 }, { attr: { r: 7 }, duration: 0.45, ease: 'back.out(3)' })
				.set(horizon, { opacity: 1 })
				.fromTo(horizon, { attr: { x1: 320, x2: 320 } }, { attr: { x1: 40, x2: 600 }, duration: 0.7, ease: 'expo.out' }, '>-0.05')
				.to(seed, { attr: { r: 0 }, duration: 0.3 }, '<');
			// Outermost first on each side, working in toward the centre
			bySide('left').forEach((p, i) => formTl.fromTo(p, undrawn(p), draw, 1.0 + i * 0.12));
			bySide('right').reverse().forEach((p, i) => formTl.fromTo(p, undrawn(p), draw, 1.0 + i * 0.12));
			bySide('center').forEach((p) => formTl.fromTo(p, undrawn(p), draw, 1.35));
			formTl
				.to(horizon, { opacity: 0, attr: { x1: 320, x2: 320 }, duration: 0.8, ease: 'power2.inOut' }, 1.5)
				.fromTo(nameLetters, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.7, stagger: 0.035, ease: 'expo.out' }, 1.9);
			formTl.progress(0);

			ScrollTrigger.create({
				trigger: siteFooter,
				start: 'top 60%',
				onEnter: () => formTl.timeScale(1).play(),
				onLeaveBack: () => formTl.timeScale(2.5).reverse(),
			});
		}
	}

	// ==========================================================================
	// 10. Deployment-Friendly Motion Components Engine (Kokonut, Motion & Bklit)
	// ==========================================================================

	// Motion flags state for live toggle in Motion Lab
	const motionState = {
		tilt: true,
		magnetic: true,
		spotlight: true,
		particles: true,
		dock: true
	};

	// (A) Kokonut-Style Radial Cursor Spotlight Cards
	const initSpotlightCards = () => {
		const spotlightCards = document.querySelectorAll('[data-spotlight]');
		if (!spotlightCards.length) return;

		spotlightCards.forEach((card) => {
			card.addEventListener('pointerenter', () => {
				if (!motionState.spotlight) return;
				card.style.setProperty('--spotlight-opacity', '1');
			});

			card.addEventListener('pointerleave', () => {
				card.style.setProperty('--spotlight-opacity', '0');
			});

			card.addEventListener('pointermove', (e) => {
				if (!motionState.spotlight) return;
				const rect = card.getBoundingClientRect();
				const x = e.clientX - rect.left;
				const y = e.clientY - rect.top;
				card.style.setProperty('--spotlight-x', `${x}px`);
				card.style.setProperty('--spotlight-y', `${y}px`);
			});
		});
	};

	// (B) Magnetic Button Physics with Spring Damping
	const initMagneticButtons = () => {
		if (!motionEnabled) return;
		const magneticButtons = document.querySelectorAll('[data-magnetic]');
		if (!magneticButtons.length) return;

		magneticButtons.forEach((btn) => {
			let isHovered = false;
			let currentX = 0;
			let currentY = 0;
			let targetX = 0;
			let targetY = 0;
			let rafId = null;

			const updatePosition = () => {
				if (!motionState.magnetic) {
					btn.style.transform = 'translate3d(0, 0, 0)';
					rafId = null;
					return;
				}

				currentX += (targetX - currentX) * 0.22;
				currentY += (targetY - currentY) * 0.22;
				btn.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;

				if (isHovered || Math.abs(currentX) > 0.1 || Math.abs(currentY) > 0.1) {
					rafId = requestAnimationFrame(updatePosition);
				} else {
					btn.style.transform = 'translate3d(0, 0, 0)';
					rafId = null;
				}
			};

			btn.addEventListener('pointerenter', () => {
				if (!motionState.magnetic) return;
				isHovered = true;
				if (!rafId) rafId = requestAnimationFrame(updatePosition);
			});

			btn.addEventListener('pointermove', (e) => {
				if (!motionState.magnetic) return;
				const rect = btn.getBoundingClientRect();
				const centerX = rect.left + rect.width / 2;
				const centerY = rect.top + rect.height / 2;
				const dx = e.clientX - centerX;
				const dy = e.clientY - centerY;
				targetX = Math.max(-12, Math.min(12, dx * 0.35));
				targetY = Math.max(-12, Math.min(12, dy * 0.35));
			});

			btn.addEventListener('pointerleave', () => {
				isHovered = false;
				targetX = 0;
				targetY = 0;
			});
		});
	};

	// (C) Kokonut Particle Burst Button Detonation
	const initParticleBurst = () => {
		if (!motionEnabled) return;
		const burstButtons = document.querySelectorAll('[data-particle-burst]');
		if (!burstButtons.length) return;

		let canvas = document.querySelector('.particle-spark-canvas');
		if (!canvas) {
			canvas = document.createElement('canvas');
			canvas.className = 'particle-spark-canvas';
			canvas.setAttribute('aria-hidden', 'true');
			document.body.appendChild(canvas);
		}

		const ctx = canvas.getContext('2d');
		let particles = [];
		let animationFrame = null;

		const resizeCanvas = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};
		resizeCanvas();
		window.addEventListener('resize', resizeCanvas, { passive: true });

		// Amber family (--color-accent-deep / -accent / -hover / -soft / platinum as hex): sparks come off amber buttons
		const colors = ['#c9984c', '#eab96b', '#f5c87e', '#f5daae', '#f7faf9'];

		const createSparks = (originX, originY) => {
			if (!motionState.particles) return;
			const count = 22;
			for (let i = 0; i < count; i++) {
				const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
				const speed = 2.5 + Math.random() * 4.5;
				particles.push({
					x: originX,
					y: originY,
					vx: Math.cos(angle) * speed,
					vy: Math.sin(angle) * speed - 1.2,
					radius: 1.5 + Math.random() * 2.2,
					color: colors[Math.floor(Math.random() * colors.length)],
					alpha: 1,
					decay: 0.022 + Math.random() * 0.018,
					gravity: 0.12
				});
			}

			if (!animationFrame) {
				animationFrame = requestAnimationFrame(renderSparks);
			}
		};

		const renderSparks = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			for (let i = particles.length - 1; i >= 0; i--) {
				const p = particles[i];
				p.x += p.vx;
				p.y += p.vy;
				p.vy += p.gravity;
				p.alpha -= p.decay;
				p.radius *= 0.98;

				if (p.alpha <= 0 || p.radius <= 0.2) {
					particles.splice(i, 1);
					continue;
				}

				ctx.save();
				ctx.globalAlpha = Math.max(0, p.alpha);
				ctx.fillStyle = p.color;
				ctx.shadowBlur = 8;
				ctx.shadowColor = p.color;
				ctx.beginPath();
				ctx.arc(p.x, p.y, Math.max(0.5, p.radius), 0, Math.PI * 2);
				ctx.fill();
				ctx.restore();
			}

			if (particles.length > 0) {
				animationFrame = requestAnimationFrame(renderSparks);
			} else {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				animationFrame = null;
			}
		};

		burstButtons.forEach((btn) => {
			btn.addEventListener('click', (e) => {
				const rect = btn.getBoundingClientRect();
				const x = e.clientX || (rect.left + rect.width / 2);
				const y = e.clientY || (rect.top + rect.height / 2);
				createSparks(x, y);
			});
		});
	};

	// (D) Cybernetic Text Scramble Decoder Reveal
	let scramblerInstances = [];
	const initTextScramble = () => {
		if (!motionEnabled) return;
		const scrambleElements = document.querySelectorAll('[data-scramble]');
		if (!scrambleElements.length) return;

		const glyphs = '!<>-_\\/[]{}=+*^?#________';

		class TextScrambler {
			constructor(el) {
				this.el = el;
				this.originalText = el.getAttribute('data-scramble') || el.innerText;
				this.frame = 0;
				this.queue = [];
				this.isScrambling = false;
				this.hasPlayed = false;
			}

			setText(newText) {
				const oldText = this.el.innerText;
				const length = Math.max(oldText.length, newText.length);
				this.queue = [];
				for (let i = 0; i < length; i++) {
					const from = oldText[i] || '';
					const to = newText[i] || '';
					const start = Math.floor(Math.random() * 12);
					const end = start + Math.floor(Math.random() * 16) + 10;
					this.queue.push({ from, to, start, end, char: '' });
				}
				this.frame = 0;
				this.update();
			}

			update() {
				let output = '';
				let complete = 0;
				for (let i = 0, n = this.queue.length; i < n; i++) {
					let { from, to, start, end, char } = this.queue[i];
					if (this.frame >= end) {
						complete++;
						output += to;
					} else if (this.frame >= start) {
						if (!char || Math.random() < 0.28) {
							char = glyphs[Math.floor(Math.random() * glyphs.length)];
							this.queue[i].char = char;
						}
						// Dimmed copy of the label's own colour, so glyphs read on dark and amber surfaces alike
						output += `<span style="opacity: 0.45;">${char}</span>`;
					} else {
						output += from;
					}
				}

				this.el.innerHTML = output;

				if (complete < this.queue.length) {
					this.frame++;
					requestAnimationFrame(() => this.update());
				} else {
					this.el.innerText = this.originalText;
					this.isScrambling = false;
				}
			}

			play() {
				if (this.isScrambling) return;
				this.hasPlayed = true;
				this.isScrambling = true;
				this.setText(this.originalText);
			}
		}

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						const scrambler = entry.target._scrambler;
						if (scrambler && !scrambler.hasPlayed) scrambler.play();
					}
				});
			},
			{ threshold: 0.2 }
		);

		scramblerInstances = [];
		scrambleElements.forEach((el) => {
			const scrambler = new TextScrambler(el);
			el._scrambler = scrambler;
			scramblerInstances.push(scrambler);
			observer.observe(el);
		});
	};

	// (E) Bklit UI Live Animated Metric Counters & SVG Sparklines
	const initMetricCountersAndSparklines = () => {
		const metricSection = document.getElementById('metrics');
		if (!metricSection) return;

		const counterElements = metricSection.querySelectorAll('[data-counter]');
		const sparklinePaths = metricSection.querySelectorAll('.sparkline-path');

		const animateCounter = (el) => {
			const target = parseFloat(el.getAttribute('data-counter'));
			const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
			const suffix = el.getAttribute('data-suffix') || '';
			const duration = 1600;
			const startTime = performance.now();

			const step = (now) => {
				const elapsed = now - startTime;
				const progress = Math.min(1, elapsed / duration);
				const easeOut = 1 - Math.pow(1 - progress, 3);
				const current = target * easeOut;

				el.textContent = current.toFixed(decimals) + suffix;

				if (progress < 1) {
					requestAnimationFrame(step);
				} else {
					el.textContent = (decimals > 0 ? target.toFixed(decimals) : target) + suffix;
				}
			};

			requestAnimationFrame(step);
		};

		let hasAnimated = false;
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting && !hasAnimated) {
						hasAnimated = true;

						counterElements.forEach((counter) => animateCounter(counter));

						sparklinePaths.forEach((path, idx) => {
							setTimeout(() => {
								path.classList.add('revealed');
							}, idx * 120);
						});
					}
				});
			},
			{ threshold: 0.25 }
		);

		observer.observe(metricSection);
	};

	// (F) 3D Perspective Parallax Tilt with Specular Glare (taste-skill Section 10)
	const initParallaxTilt = () => {
		if (!motionEnabled) return;
		const tiltCards = document.querySelectorAll('[data-tilt]');
		if (!tiltCards.length) return;

		const maxTiltAngle = 7.5; // degrees

		tiltCards.forEach((card) => {
			let rafId = null;
			let targetRotateX = 0;
			let targetRotateY = 0;
			let currentRotateX = 0;
			let currentRotateY = 0;

			const updateTilt = () => {
				if (!motionState.tilt) {
					card.style.transform = '';
					card.style.setProperty('--glare-opacity', '0');
					rafId = null;
					return;
				}

				currentRotateX += (targetRotateX - currentRotateX) * 0.16;
				currentRotateY += (targetRotateY - currentRotateY) * 0.16;

				card.style.transform = `perspective(1000px) rotateX(${currentRotateX.toFixed(2)}deg) rotateY(${currentRotateY.toFixed(2)}deg) scale3d(1.015, 1.015, 1.015)`;

				if (Math.abs(targetRotateX - currentRotateX) > 0.05 || Math.abs(targetRotateY - currentRotateY) > 0.05) {
					rafId = requestAnimationFrame(updateTilt);
				} else if (targetRotateX === 0 && targetRotateY === 0) {
					card.style.transform = '';
					rafId = null;
				}
			};

			card.addEventListener('pointerenter', () => {
				if (!motionState.tilt) return;
				card.classList.add('tilt-active');
				card.style.setProperty('--glare-opacity', '0.22');
			});

			card.addEventListener('pointermove', (e) => {
				if (!motionState.tilt) return;
				const rect = card.getBoundingClientRect();
				const x = (e.clientX - rect.left) / rect.width; // 0 to 1
				const y = (e.clientY - rect.top) / rect.height; // 0 to 1

				targetRotateX = (0.5 - y) * maxTiltAngle * 2;
				targetRotateY = (x - 0.5) * maxTiltAngle * 2;

				card.style.setProperty('--glare-x', `${(x * 100).toFixed(1)}%`);
				card.style.setProperty('--glare-y', `${(y * 100).toFixed(1)}%`);

				if (!rafId) rafId = requestAnimationFrame(updateTilt);
			});

			card.addEventListener('pointerleave', () => {
				card.classList.remove('tilt-active');
				targetRotateX = 0;
				targetRotateY = 0;
				card.style.setProperty('--glare-opacity', '0');
				if (!rafId) rafId = requestAnimationFrame(updateTilt);
			});
		});
	};

	// (G) Mac OS Dynamic Fluid Nav Dock (taste-skill Section 10)
	const initDockMagnification = () => {
		if (!motionEnabled || window.innerWidth < 769) return;
		const nav = document.querySelector('.site-header__nav');
		if (!nav) return;

		const navLinks = Array.from(nav.querySelectorAll('.nav-link'));
		const maxScale = 0.14; // +14% scale max
		const sigma = 50; // spread radius in px

		nav.addEventListener('pointermove', (e) => {
			if (!motionState.dock) return;
			const mouseX = e.clientX;

			navLinks.forEach((link) => {
				const rect = link.getBoundingClientRect();
				const linkCenterX = rect.left + rect.width / 2;
				const distance = Math.abs(mouseX - linkCenterX);

				// Gaussian curve: f(d) = maxScale * exp(-d^2 / (2 * sigma^2))
				const scaleBoost = maxScale * Math.exp(-(distance * distance) / (2 * sigma * sigma));
				const currentScale = 1 + scaleBoost;

				link.style.transform = `scale(${currentScale.toFixed(3)}) translateY(${-scaleBoost * 8}px)`;
			});
		});

		nav.addEventListener('pointerleave', () => {
			navLinks.forEach((link) => {
				link.style.transform = '';
			});
		});
	};

	// (H) Tactile Push & Click Shockwave Ripple (taste-skill Section 4.5 & 10)
	const initTactileRipple = () => {
		document.addEventListener('click', (e) => {
			const target = e.target.closest('.btn-aurora, .btn-kelp, .btn-header-touch, .social-link, .tech-pill');
			if (!target) return;

			const ripple = document.createElement('span');
			ripple.className = 'tactile-ripple-wave';
			ripple.style.left = `${e.clientX}px`;
			ripple.style.top = `${e.clientY}px`;
			document.body.appendChild(ripple);

			ripple.addEventListener('animationend', () => {
				ripple.remove();
			});
		});
	};

	// Initialize all motion modules
	initSpotlightCards();
	initMagneticButtons();
	initParticleBurst();
	initTextScramble();
	initMetricCountersAndSparklines();
	initParallaxTilt();
	initDockMagnification();
	initTactileRipple();
});
