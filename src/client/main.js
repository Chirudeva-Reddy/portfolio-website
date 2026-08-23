import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

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

	// ==========================================================================
	// 2. 3D WebGL Bioluminescent Particle Sphere (Auros Centered Signature Visual)
	// ==========================================================================
	const canvas = document.getElementById('hero-canvas');
	let threeScene, threeCamera, threeRenderer, particleSystem, particlePositions, basePositions;
	let mouseXNorm = 0;
	let mouseYNorm = 0;
	let targetRotX = 0;
	let targetRotY = 0;
	let mouseWorldX = 0;
	let mouseWorldY = 0;
	let mouseVelX = 0;
	let mouseVelY = 0;
	let mouseSpeed = 0;
	let lastPointerX = 0;
	let lastPointerY = 0;
	let lastPointerTime = performance.now();

	if (canvas && motionEnabled) {
		try {
			threeScene = new THREE.Scene();

			threeCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
			threeCamera.position.z = 7.2;

			threeRenderer = new THREE.WebGLRenderer({
				canvas,
				alpha: true,
				antialias: true,
				powerPreference: 'high-performance',
			});
			threeRenderer.setSize(window.innerWidth, window.innerHeight);
			threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

			// Soft circular glow point texture generated programmatically
			const createGlowTexture = () => {
				const size = 64;
				const tempCanvas = document.createElement('canvas');
				tempCanvas.width = size;
				tempCanvas.height = size;
				const ctx = tempCanvas.getContext('2d');

				const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
				gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
				gradient.addColorStop(0.2, 'rgba(203, 255, 252, 0.9)');
				gradient.addColorStop(0.5, 'rgba(0, 130, 124, 0.4)');
				gradient.addColorStop(1, 'rgba(0, 38, 36, 0)');

				ctx.fillStyle = gradient;
				ctx.fillRect(0, 0, size, size);

				const texture = new THREE.CanvasTexture(tempCanvas);
				texture.needsUpdate = true;
				return texture;
			};

			// Generate Bioluminescent Particles with Multi-Shape Morphological Lifecycle (Sphere -> Ultra-Thick DNA & Deep Particulate Field -> Torus -> Galaxy)
			const particleCount = 6800;
			const geometry = new THREE.BufferGeometry();
			particlePositions = new Float32Array(particleCount * 3);
			const spherePositions = new Float32Array(particleCount * 3);
			const dnaPositions = new Float32Array(particleCount * 3);
			const torusPositions = new Float32Array(particleCount * 3);
			const galaxyPositions = new Float32Array(particleCount * 3);
			const scatterBurstVectors = new Float32Array(particleCount * 3);
			const noiseOffsets = new Float32Array(particleCount * 3);
			const colors = new Float32Array(particleCount * 3);

			const colorPalette = [
				new THREE.Color('#00827c'), // Deep Teal
				new THREE.Color('#2ef4eb'), // Vibrant Cyan
				new THREE.Color('#cbfffc'), // Pale Aqua
				new THREE.Color('#edfffe'), // Liquid Mist
				new THREE.Color('#fde9ff'), // Lavender Phosphor Pink
				new THREE.Color('#ffffff'), // Platinum White
			];

			const sphereRadius = 2.45;
			const dnaHeight = 14.5; // Spans full vertical screen height with overhead margin
			const dnaRadius = 3.4; // Wide, dramatic radius across screen
			const strandThickness = 0.95; // Thick volumetric multi-fiber cylindrical body
			const numRungs = 34; // Dense horizontal hydrogen cross-linking bridges
			const torusMajor = 2.9;
			const torusMinor = 1.15;

			for (let i = 0; i < particleCount; i++) {
				const i3 = i * 3;

				// 1. Base Shape: Celestial Particle Globe with Saturn Planetary Rings & Stardust Stream (Asymmetric 3D Orbit)
				let sx = 0, sy = 0, sz = 0;

				if (i < 4200) {
					// Core Celestial Sphere (62%)
					const uSphere = Math.random();
					const vSphere = Math.random();
					const thetaSphere = uSphere * 2.0 * Math.PI;
					const phiSphere = Math.acos(2.0 * vSphere - 1.0);
					const rSphere = sphereRadius + (Math.random() - 0.5) * 0.35;

					sx = rSphere * Math.sin(phiSphere) * Math.cos(thetaSphere);
					sy = rSphere * Math.sin(phiSphere) * Math.sin(thetaSphere);
					sz = rSphere * Math.cos(phiSphere);
				} else if (i < 5800) {
					// Saturn-Style Planetary Orbital Rings (24%): Concentric tilted elliptical rings
					const ringU = (i - 4200) / 1600;
					const ringAngle = ringU * Math.PI * 2.0 + (Math.random() - 0.5) * 0.15;
					const ringRadius = 3.6 + Math.pow(Math.random(), 0.6) * 1.8;
					const ringTiltX = 0.42; // Tilt around X-axis
					const ringTiltY = 0.32; // Tilt around Y-axis
					
					let rx = ringRadius * Math.cos(ringAngle);
					let ry = (Math.random() - 0.5) * 0.14;
					let rz = ringRadius * Math.sin(ringAngle);

					// Apply 3D rotation matrix for realistic orbital slant
					const cosX = Math.cos(ringTiltX), sinX = Math.sin(ringTiltX);
					const ry1 = ry * cosX - rz * sinX;
					const rz1 = ry * sinX + rz * cosX;

					const cosY = Math.cos(ringTiltY), sinY = Math.sin(ringTiltY);
					sx = rx * cosY + rz1 * sinY;
					sy = ry1;
					sz = -rx * sinY + rz1 * cosY;
				} else {
					// Flowing Galactic Stardust Stream / Particle Tail (14%)
					const tTail = (i - 5800) / 1000;
					const tailAngle = tTail * Math.PI * 2.8 - 0.8;
					const tailRadius = 2.8 + tTail * 4.2;
					const tailSpread = (Math.random() - 0.5) * (0.4 + tTail * 1.2);

					sx = tailRadius * Math.cos(tailAngle) + (Math.random() - 0.5) * 0.5;
					sy = -0.8 + Math.sin(tailAngle * 1.2) * 1.6 + tailSpread;
					sz = tailRadius * Math.sin(tailAngle) * 0.6 + (Math.random() - 0.5) * 0.8;
				}

				spherePositions[i3] = sx;
				spherePositions[i3 + 1] = sy;
				spherePositions[i3 + 2] = sz;

				// Initial positions start at celestial globe + rings
				particlePositions[i3] = sx;
				particlePositions[i3 + 1] = sy;
				particlePositions[i3 + 2] = sz;

				// 2. Shape 2: Ultra-Thick Volumetric DNA Double Helix + Full-Screen Particulate Cloud
				if (i < 1904) {
					// Strand Alpha: Multi-fiber Volumetric Cylindrical Helix (28%)
					const t = i / 1904;
					const y = (t - 0.5) * dnaHeight;
					const angle = y * 1.35;
					const subFiberPhase = (i % 4) * (Math.PI / 2);
					const subFiberRadius = 0.28;
					const psi = Math.random() * Math.PI * 2;
					const rTube = Math.sqrt(Math.random()) * strandThickness;
					
					const offX = (rTube * Math.cos(psi) + subFiberRadius * Math.cos(subFiberPhase));
					const offZ = (rTube * Math.sin(psi) + subFiberRadius * Math.sin(subFiberPhase));

					dnaPositions[i3] = (dnaRadius + offX) * Math.cos(angle) - offZ * Math.sin(angle);
					dnaPositions[i3 + 1] = y + (Math.random() - 0.5) * 0.16;
					dnaPositions[i3 + 2] = (dnaRadius + offX) * Math.sin(angle) + offZ * Math.cos(angle);
				} else if (i < 3808) {
					// Strand Beta: Multi-fiber Volumetric Cylindrical Helix with PI phase shift (28%)
					const t = (i - 1904) / 1904;
					const y = (t - 0.5) * dnaHeight;
					const angle = y * 1.35 + Math.PI;
					const subFiberPhase = (i % 4) * (Math.PI / 2);
					const subFiberRadius = 0.28;
					const psi = Math.random() * Math.PI * 2;
					const rTube = Math.sqrt(Math.random()) * strandThickness;

					const offX = (rTube * Math.cos(psi) + subFiberRadius * Math.cos(subFiberPhase));
					const offZ = (rTube * Math.sin(psi) + subFiberRadius * Math.sin(subFiberPhase));

					dnaPositions[i3] = (dnaRadius + offX) * Math.cos(angle) - offZ * Math.sin(angle);
					dnaPositions[i3 + 1] = y + (Math.random() - 0.5) * 0.16;
					dnaPositions[i3 + 2] = (dnaRadius + offX) * Math.sin(angle) + offZ * Math.cos(angle);
				} else if (i < 5304) {
					// Hydrogen Base Pair Bridges: Thick Horizontal Connecting Rungs (22%)
					const rungIdx = Math.floor(((i - 3808) / 1496) * numRungs);
					const yRung = ((rungIdx / (numRungs - 1)) - 0.5) * (dnaHeight * 0.94);
					const angle = yRung * 1.35;
					const alpha = (Math.random() * 2.0 - 1.0) * 0.96;
					const rungJitterX = (Math.random() - 0.5) * 0.32;
					const rungJitterZ = (Math.random() - 0.5) * 0.32;
					const rungJitterY = (Math.random() - 0.5) * 0.20;

					dnaPositions[i3] = alpha * dnaRadius * Math.cos(angle) + rungJitterX;
					dnaPositions[i3 + 1] = yRung + rungJitterY;
					dnaPositions[i3 + 2] = alpha * dnaRadius * Math.sin(angle) + rungJitterZ;
				} else {
					// Full-Screen Atmospheric DNA Particulate Cloud / High-Volume Molecular Dust (22%)
					const yCloud = (Math.random() - 0.5) * (dnaHeight * 1.25);
					const rCloud = dnaRadius + 0.6 + Math.pow(Math.random(), 0.7) * 7.5;
					const angleCloud = yCloud * 1.35 + (Math.random() - 0.5) * 3.4;

					dnaPositions[i3] = rCloud * Math.cos(angleCloud) + (Math.random() - 0.5) * 2.8;
					dnaPositions[i3 + 1] = yCloud + (Math.random() - 0.5) * 1.4;
					dnaPositions[i3 + 2] = rCloud * Math.sin(angleCloud) + (Math.random() - 0.5) * 3.6;
				}

				// 3. Shape 3: Cybernetic Neural Torus Ring (Matrix Mode)
				const uTorus = Math.random() * Math.PI * 2;
				const vTorus = Math.random() * Math.PI * 2;
				torusPositions[i3] = (torusMajor + torusMinor * Math.cos(vTorus)) * Math.cos(uTorus);
				torusPositions[i3 + 1] = torusMinor * Math.sin(vTorus) + (Math.random() - 0.5) * 0.22;
				torusPositions[i3 + 2] = (torusMajor + torusMinor * Math.cos(vTorus)) * Math.sin(uTorus);

				// 4. Shape 4: Cosmic Spiral Galaxy Field
				const uGal = Math.random();
				const rGal = 0.6 + 6.4 * Math.pow(uGal, 0.75);
				const armOffset = (i % 2 === 0) ? 0 : Math.PI;
				const thetaGal = rGal * 1.4 + armOffset + (Math.random() - 0.5) * 0.45;
				galaxyPositions[i3] = rGal * Math.cos(thetaGal);
				galaxyPositions[i3 + 1] = (Math.random() - 0.5) * (0.8 + rGal * 0.25);
				galaxyPositions[i3 + 2] = rGal * Math.sin(thetaGal);

				// Volumetric Scatter Burst Vectors (for explosive 3D volumetric dispersion)
				scatterBurstVectors[i3] = (Math.random() - 0.5) * 14.0;
				scatterBurstVectors[i3 + 1] = (Math.random() - 0.5) * 12.0;
				scatterBurstVectors[i3 + 2] = (Math.random() - 0.5) * 10.0;

				// Noise & Per-Particle Phase Offsets
				noiseOffsets[i3] = Math.random() * Math.PI * 2;
				noiseOffsets[i3 + 1] = Math.random() * Math.PI * 2;
				noiseOffsets[i3 + 2] = Math.random() * Math.PI * 2;

				// Color assignment
				const chosenColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
				colors[i3] = chosenColor.r;
				colors[i3 + 1] = chosenColor.g;
				colors[i3 + 2] = chosenColor.b;
			}

			geometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
			geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

			const material = new THREE.PointsMaterial({
				size: 0.044, // Refined, smaller, crisp high-density bioluminescent particles
				vertexColors: true,
				map: createGlowTexture(),
				transparent: true,
				opacity: 0.80,
				blending: THREE.AdditiveBlending,
				depthWrite: false,
			});

			particleSystem = new THREE.Points(geometry, material);
			particleSystem.position.x = 0; // Centered behind the Hero text stack
			particleSystem.position.y = 0;
			threeScene.add(particleSystem);

			// Mouse Move Tracking for 3D Parallax Tilt & Kinetic Vector Flow Field
			window.addEventListener('pointermove', (e) => {
				const now = performance.now();
				const dt = Math.max(1, now - lastPointerTime) / 1000;
				lastPointerTime = now;

				const prevNormX = mouseXNorm;
				const prevNormY = mouseYNorm;

				mouseXNorm = (e.clientX / window.innerWidth) * 2 - 1;
				mouseYNorm = -(e.clientY / window.innerHeight) * 2 + 1;
				targetRotY = mouseXNorm * 0.4;
				targetRotX = -mouseYNorm * 0.3;

				// Map to 3D World space coordinates at camera distance
				mouseWorldX = mouseXNorm * 4.6;
				mouseWorldY = mouseYNorm * 3.0;

				// Instantaneous cursor velocity vector
				const vx = (mouseXNorm - prevNormX) / dt;
				const vy = (mouseYNorm - prevNormY) / dt;
				mouseVelX = mouseVelX * 0.6 + vx * 0.4;
				mouseVelY = mouseVelY * 0.6 + vy * 0.4;
				mouseSpeed = Math.min(3.5, Math.sqrt(mouseVelX * mouseVelX + mouseVelY * mouseVelY));
			}, { passive: true });

			// Resize Handler
			window.addEventListener('resize', () => {
				if (!threeCamera || !threeRenderer) return;
				threeCamera.aspect = window.innerWidth / window.innerHeight;
				threeCamera.updateProjectionMatrix();
				threeRenderer.setSize(window.innerWidth, window.innerHeight);
				threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
			});

			// Multi-Stage Interactive Scroll Render Loop
			const startedAt = performance.now();
			let smoothScrollProgress = 0;
			let isSleeping = false;
			let rafId = null;

			const updateScrollProgress = () => {
				const scrollY = window.scrollY || window.pageYOffset || 0;
				const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
				const targetProgress = Math.min(1, Math.max(0, scrollY / maxScroll));
				smoothScrollProgress += (targetProgress - smoothScrollProgress) * 0.08;

				if (isSleeping && targetProgress < 0.88) {
					isSleeping = false;
					if (rafId === null) animate3D();
				}
			};

			window.addEventListener('scroll', updateScrollProgress, { passive: true });
			if (lenis) {
				lenis.on('scroll', updateScrollProgress);
			}

			// Background tab throttling to release GPU
			document.addEventListener('visibilitychange', () => {
				if (document.hidden) {
					if (rafId !== null) cancelAnimationFrame(rafId);
					rafId = null;
				} else if (!isSleeping && rafId === null) {
					animate3D();
				}
			});

			const animate3D = () => {
				if (document.hidden) {
					rafId = null;
					return;
				}

				updateScrollProgress();

				// If scrolled into the footer and opacity reaches 0, sleep the render loop
				if (smoothScrollProgress >= 0.88) {
					if (particleSystem) {
						material.opacity = 0;
						threeRenderer.render(threeScene, threeCamera);
					}
					isSleeping = true;
					rafId = null;
					return;
				}

				rafId = requestAnimationFrame(animate3D);
				const elapsedTime = (performance.now() - startedAt) / 1000;

				if (particleSystem) {
					// 1. Inertial Parallax & Continuous 3D Rotation
					particleSystem.rotation.y += 0.002 + (smoothScrollProgress * 0.003);
					particleSystem.rotation.x += (targetRotX - particleSystem.rotation.x) * 0.05;
					particleSystem.rotation.y += (targetRotY - particleSystem.rotation.y) * 0.05;

					// 2. Multi-Stage Morphing Weights & Volumetric Scattering Pulse
					let wSphere = 0;
					let wDna = 0;
					let wTorus = 0;
					let wGalaxy = 0;
					let scatterWeight = 0;

					if (smoothScrollProgress < 0.12) {
						// Stage 1: Sphere in Hero
						wSphere = 1;
					} else if (smoothScrollProgress < 0.28) {
						// Stage 1 -> 2: High-Volume Scatter & Morph into Thick DNA Double Helix
						const t = (smoothScrollProgress - 0.12) / 0.16;
						const smoothT = t * t * (3 - 2 * t);
						wSphere = 1 - smoothT;
						wDna = smoothT;
						scatterWeight = Math.sin(t * Math.PI) * 0.35; // Volumetric burst during morph
					} else if (smoothScrollProgress < 0.44) {
						// Stage 2: Rotating Ultra-Thick DNA Double Helix in Research
						wDna = 1;
					} else if (smoothScrollProgress < 0.58) {
						// Stage 2 -> 3: DNA Unravels into Neural Torus
						const t = (smoothScrollProgress - 0.44) / 0.14;
						const smoothT = t * t * (3 - 2 * t);
						wDna = 1 - smoothT;
						wTorus = smoothT;
						scatterWeight = Math.sin(t * Math.PI) * 0.25;
					} else if (smoothScrollProgress < 0.74) {
						// Stage 3: Swirling Neural Torus in Matrix
						wTorus = 1;
					} else if (smoothScrollProgress < 0.88) {
						// Stage 3 -> 4: Torus expands into Cosmic Galaxy
						const t = (smoothScrollProgress - 0.74) / 0.14;
						const smoothT = t * t * (3 - 2 * t);
						wTorus = 1 - smoothT;
						wGalaxy = smoothT;
						scatterWeight = Math.sin(t * Math.PI) * 0.30;
					} else {
						wGalaxy = 1;
					}

					// Opacity Curve: 0.80 in hero -> 0.70 in DNA -> 0.48 in matrix -> 0.0 near footer
					let currentOpacity = 0.80;
					if (smoothScrollProgress > 0.12 && smoothScrollProgress <= 0.45) {
						currentOpacity = 0.80 - (smoothScrollProgress - 0.12) * 0.30;
					} else if (smoothScrollProgress > 0.45 && smoothScrollProgress <= 0.75) {
						currentOpacity = 0.70 - (smoothScrollProgress - 0.45) * 0.73;
					} else if (smoothScrollProgress > 0.75) {
						currentOpacity = Math.max(0, 0.48 - (smoothScrollProgress - 0.75) * 3.69);
					}

					material.opacity = currentOpacity;
					material.size = 0.044 - (smoothScrollProgress * 0.012);

					// Kinetic velocity decay per frame
					mouseSpeed *= 0.94;
					mouseVelX *= 0.92;
					mouseVelY *= 0.92;

					// Dynamic Particle Position Calculation with 3D Vector Flow Field
					const positions = particleSystem.geometry.attributes.position.array;
					for (let i = 0; i < particleCount; i++) {
						const i3 = i * 3;

						const sx = spherePositions[i3];
						const sy = spherePositions[i3 + 1];
						const sz = spherePositions[i3 + 2];

						const dnx = dnaPositions[i3];
						const dny = dnaPositions[i3 + 1];
						const dnz = dnaPositions[i3 + 2];

						const tx = torusPositions[i3];
						const ty = torusPositions[i3 + 1];
						const tz = torusPositions[i3 + 2];

						const gx = galaxyPositions[i3];
						const gy = galaxyPositions[i3 + 1];
						const gz = galaxyPositions[i3 + 2];

						const bx = scatterBurstVectors[i3];
						const by = scatterBurstVectors[i3 + 1];
						const bz = scatterBurstVectors[i3 + 2];

						// Blended target coordinate with Volumetric Scatter Burst
						const px = (wSphere * sx + wDna * dnx + wTorus * tx + wGalaxy * gx) + (bx * scatterWeight);
						const py = (wSphere * sy + wDna * dny + wTorus * ty + wGalaxy * gy) + (by * scatterWeight);
						const pz = (wSphere * sz + wDna * dnz + wTorus * tz + wGalaxy * gz) + (bz * scatterWeight);

						// Ambient organic fluid wave
						const wave = Math.sin(elapsedTime * 1.35 + px * 0.85 + py * 0.95 + noiseOffsets[i3]) * 0.045;

						// 3D Vector Flow Field & Wake Vorticity
						const dx = px - mouseWorldX;
						const dy = py - mouseWorldY;
						const distSq = dx * dx + dy * dy;

						let flowX = 0;
						let flowY = 0;
						let flowZ = 0;

						// Flow field active within cursor influence radius (primarily in Hero & early scroll)
						if (distSq < 11.0 && smoothScrollProgress < 0.40) {
							const dist = Math.sqrt(distSq) + 0.001;
							const influence = Math.exp(-distSq / 2.5) * (0.40 + mouseSpeed * 0.32);

							// Vector Curl noise (perpendicular vortex swirl)
							const curlX = -dy / dist;
							const curlY = dx / dist;

							// Repulsion + wake swirl displacement
							flowX = ((dx / dist) * 0.38 + curlX * 0.58 + mouseVelX * 0.06) * influence;
							flowY = ((dy / dist) * 0.38 + curlY * 0.58 + mouseVelY * 0.06) * influence;
							flowZ = Math.sin(elapsedTime * 2.5 + noiseOffsets[i3]) * 0.48 * influence;
						}

						positions[i3] = px + wave * Math.cos(noiseOffsets[i3]) + flowX;
						positions[i3 + 1] = py + wave * Math.sin(noiseOffsets[i3]) + flowY;
						positions[i3 + 2] = pz + wave * Math.cos(noiseOffsets[i3] * 0.5) + flowZ;
					}
					particleSystem.geometry.attributes.position.needsUpdate = true;

					// Subtle Y parallax drift
					particleSystem.position.y = -smoothScrollProgress * 1.4;
				}

				threeRenderer.render(threeScene, threeCamera);
			};

			animate3D();
		} catch (err) {
			console.warn('WebGL Particle Sphere initialization skipped:', err);
		}
	}

	// ==========================================================================
	// 3. Custom Precision Interactive Cursor
	// ==========================================================================
	const cursorGlow = motionEnabled ? document.querySelector('.cursor-glow') : null;
	const cursorDot = motionEnabled ? document.querySelector('.cursor-dot') : null;
	const cursorRing = motionEnabled ? document.querySelector('.cursor-ring') : null;
	const cursorLabel = motionEnabled ? document.querySelector('.cursor-label') : null;

	let mouseX = window.innerWidth / 2;
	let mouseY = window.innerHeight / 2;
	let targetMouseX = mouseX;
	let targetMouseY = mouseY;
	let magneticTarget = null;

	const renderCursor = () => {
		mouseX += (targetMouseX - mouseX) * 0.15;
		mouseY += (targetMouseY - mouseY) * 0.15;

		if (cursorGlow) cursorGlow.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
		if (cursorDot) cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;

		if (cursorRing) {
			const ringX = magneticTarget ? magneticTarget.x : mouseX;
			const ringY = magneticTarget ? magneticTarget.y : mouseY;
			cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
			if (cursorLabel) cursorLabel.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
		}

		requestAnimationFrame(renderCursor);
	};

	if (motionEnabled && cursorDot && cursorRing) {
		// Only now is it safe to hide the native pointer.
		document.documentElement.classList.add('js-cursor');

		window.addEventListener('pointermove', (e) => {
			targetMouseX = e.clientX;
			targetMouseY = e.clientY;
		}, { passive: true });

		requestAnimationFrame(renderCursor);

		const interactiveEls = document.querySelectorAll('a, button, [data-magnetic="true"], [data-cursor-text], .project-item-card, .matrix-card, .timeline-card, .bento-box-tall-highlight, .bento-box-wide, .bento-box-small, .surface-card, .about-portrait-card, .project-modal__backdrop, .project-modal__close');
		interactiveEls.forEach((el) => {
			el.addEventListener('pointerenter', () => {
				document.body.classList.add('cursor-hover');
				const rect = el.getBoundingClientRect();
				if (el.classList.contains('magnetic') || el.getAttribute('data-magnetic') === 'true') {
					magneticTarget = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
				}
				if (cursorLabel) {
					cursorLabel.textContent = el.getAttribute('data-cursor-text') || '';
				}
			});

			el.addEventListener('pointerleave', () => {
				document.body.classList.remove('cursor-hover');
				magneticTarget = null;
				if (cursorLabel) {
					cursorLabel.textContent = '';
				}
			});
		});
	}

	// ==========================================================================
	// 4. Preloader Terminal Counter & Entrance Stagger
	// ==========================================================================
	// The overlay is dismissed by the inline bootstrap script in index.html
	// (root class `is-loaded`), which runs even if this bundle never does.
	// All this module adds is the hero entrance once the overlay has cleared.
	const preloader = document.getElementById('preloader');

	if (preloader && !prefersReducedMotion) {
		const runHeroEntrance = () => {
			ScrollTrigger.refresh();

			if (motionEnabled) {
				gsap.fromTo('.hero-eyebrow', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out', clearProps: 'all' });
				gsap.fromTo('.hero-title', { y: 32, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, delay: 0.15, ease: 'power3.out', clearProps: 'all' });
				gsap.fromTo('.hero-subtext', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, delay: 0.25, ease: 'power2.out', clearProps: 'all' });
				gsap.fromTo('.hero-actions', { scale: 0.95, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, delay: 0.35, ease: 'power2.out', clearProps: 'all' });
				gsap.fromTo('.hero-status-pill', { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, delay: 0.45, ease: 'power2.out', clearProps: 'all' });
			}
		};

		if (document.documentElement.classList.contains('is-loaded')) {
			runHeroEntrance();
		} else {
			const observer = new MutationObserver(() => {
				if (document.documentElement.classList.contains('is-loaded')) {
					observer.disconnect();
					window.setTimeout(runHeroEntrance, 120);
				}
			});
			observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
			window.addEventListener('load', () => window.setTimeout(runHeroEntrance, 1500), { once: true });
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
	const revealTargets = document.querySelectorAll(
		'.bento-box-tall-highlight, .bento-box-wide, .bento-box-small, .matrix-card, .project-item-card, .timeline-card, .about-portrait-card'
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
		const tiltCards = document.querySelectorAll('.matrix-card, .timeline-card, .project-item-card, .surface-card, .bento-box-tall-highlight, .bento-box-wide, .bento-box-small, .about-portrait-frame');
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

		// Technical Matrix cards stagger
		const matrixCards = document.querySelectorAll('.matrix-card');
		if (matrixCards.length > 0) {
			gsap.fromTo(
				matrixCards,
				{ opacity: 0, y: 35 },
				{
					opacity: 1,
					y: 0,
					duration: 0.65,
					stagger: 0.08,
					ease: 'power3.out',
					scrollTrigger: {
						trigger: '.matrix-grid',
						start: 'top 85%',
						toggleActions: 'play none none none'
					}
				}
			);
		}

		// Projects alternating slide-in reveal (Even from left, Odd from right)
		const projectCards = document.querySelectorAll('.project-item-card');
		projectCards.forEach((card, index) => {
			const isEven = index % 2 === 0;
			const initialOffset = isEven ? -20 : 20; // percentage shift

			gsap.fromTo(
				card,
				{
					opacity: 0,
					xPercent: initialOffset,
					scale: 0.96
				},
				{
					opacity: 1,
					xPercent: 0,
					scale: 1,
					duration: 0.9,
					ease: 'power3.out',
					scrollTrigger: {
						trigger: card,
						start: 'top 88%',
						toggleActions: 'play none none none'
					}
				}
			);
		});

		// Experience Timeline cards reveal
		const timelineCards = document.querySelectorAll('.timeline-card');
		timelineCards.forEach((card) => {
			gsap.fromTo(
				card,
				{ opacity: 0, y: 35 },
				{
					opacity: 1,
					y: 0,
					duration: 0.75,
					ease: 'power3.out',
					scrollTrigger: {
						trigger: card,
						start: 'top 85%',
						toggleActions: 'play none none none'
					}
				}
			);
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
	const modalGithub = document.getElementById('modal-github');
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
		modalTitle.textContent = card.querySelector('.project-item-title')?.textContent || 'Project';
		modalCategory.textContent = card.querySelector('.project-category-tag')?.textContent || 'Project';
		modalDescription.textContent = card.querySelector('.project-item-desc')?.textContent || '';
		modalIndex.textContent = `CASE STUDY 0${Number(card.getAttribute('data-project') || 0) + 1} // ARCHITECTURE`;

		if (modalGithub) {
			const githubUrl = card.getAttribute('data-github') || 'https://github.com/Chirudeva-Reddy';
			modalGithub.setAttribute('href', githubUrl);
		}

		projectModal.classList.add('is-open');
		projectModal.setAttribute('aria-hidden', 'false');
		pageContent?.setAttribute('inert', '');
		document.body.classList.add('modal-open');
		if (lenis) lenis.stop();
		modalPanel?.focus({ preventScroll: true });
	};

	const closeProjectModal = () => {
		if (!projectModal) return;
		projectModal.classList.remove('is-open');
		projectModal.setAttribute('aria-hidden', 'true');
		pageContent?.removeAttribute('inert');
		document.body.classList.remove('modal-open');
		if (lenis) lenis.start();
		lastFocusedTrigger?.focus();
		lastFocusedTrigger = null;
	};

	projectCardsList.forEach((card) => {
		// The card itself stays clickable as a pointer affordance, but it is no
		// longer a role="button" wrapping links. Keyboard and screen-reader users
		// get the real <button> inside the actions row instead.
		card.addEventListener('click', (event) => {
			if (event.target.closest('a[href]')) return;
			openProjectModal(card);
		});

		const openButton = card.querySelector('[data-open-project]');
		if (openButton) {
			openButton.addEventListener('click', (event) => {
				event.stopPropagation();
				lastFocusedTrigger = openButton;
				openProjectModal(card);
			});
		}
	});

	modalClose?.addEventListener('click', closeProjectModal);
	modalBackdrop?.addEventListener('click', closeProjectModal);

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape') closeProjectModal();
	});

	projectModal?.addEventListener('keydown', (event) => {
		if (event.key !== 'Tab') return;
		const focusable = Array.from(projectModal.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])')).filter((el) => !el.hasAttribute('disabled'));
		if (focusable.length === 0) return;
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		}
		if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	});

	// ==========================================================================
	// 9. Velocity-Responsive Kinetic Footer Marquee (Smooth Flywheel)
	// ==========================================================================
	if (lenis && motionEnabled) {
		const marqueeTrack = document.querySelector('.marquee-track');
		if (marqueeTrack) {
			let targetSpeedMultiplier = 1;
			let currentSpeedMultiplier = 1;

			lenis.on('scroll', (e) => {
				// Damped velocity coupling: never exceed 1.45x baseline speed
				targetSpeedMultiplier = 1 + Math.min(0.45, Math.abs(e.velocity) * 0.005);
			});

			const updateMarqueeSpeed = () => {
				// Smooth exponential lerp towards target, with gradual decay back to 1.0
				currentSpeedMultiplier += (targetSpeedMultiplier - currentSpeedMultiplier) * 0.06;
				targetSpeedMultiplier += (1.0 - targetSpeedMultiplier) * 0.03;

				marqueeTrack.style.animationDuration = `${48 / Math.max(0.6, currentSpeedMultiplier)}s`;
				requestAnimationFrame(updateMarqueeSpeed);
			};

			requestAnimationFrame(updateMarqueeSpeed);
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

		const colors = ['#2ef4eb', '#7EF3D0', '#fde9ff', '#cbfffc', '#ffffff'];

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

		const glyphs = '!<>-_\\/[]{}—=+*^?#________';

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
						output += `<span style="color: #2ef4eb; opacity: 0.85;">${char}</span>`;
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
			const target = e.target.closest('.btn-aurora, .btn-kelp, .btn-header-touch, .social-link, .tech-pill, .project-card__open');
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
