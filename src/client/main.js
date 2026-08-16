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

			// Generate Bioluminescent Particle Sphere
			const particleCount = 3600;
			const geometry = new THREE.BufferGeometry();
			particlePositions = new Float32Array(particleCount * 3);
			basePositions = new Float32Array(particleCount * 3);
			const colors = new Float32Array(particleCount * 3);

			const colorPalette = [
				new THREE.Color('#00827c'), // Deep Teal
				new THREE.Color('#2ef4eb'), // Vibrant Cyan
				new THREE.Color('#cbfffc'), // Pale Aqua
				new THREE.Color('#edfffe'), // Liquid Mist
				new THREE.Color('#fde9ff'), // Lavender Phosphor Pink
				new THREE.Color('#ffffff'), // Platinum White
			];

			const sphereRadius = 2.8;

			for (let i = 0; i < particleCount; i++) {
				const i3 = i * 3;
				
				// Uniform spherical distribution with subtle radial thickness
				const u = Math.random();
				const v = Math.random();
				const theta = u * 2.0 * Math.PI;
				const phi = Math.acos(2.0 * v - 1.0);
				const r = sphereRadius + (Math.random() - 0.5) * 0.4;

				const x = r * Math.sin(phi) * Math.cos(theta);
				const y = r * Math.sin(phi) * Math.sin(theta);
				const z = r * Math.cos(phi);

				particlePositions[i3] = x;
				particlePositions[i3 + 1] = y;
				particlePositions[i3 + 2] = z;

				basePositions[i3] = x;
				basePositions[i3 + 1] = y;
				basePositions[i3 + 2] = z;

				// Color selection based on position & random distribution
				const chosenColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
				colors[i3] = chosenColor.r;
				colors[i3 + 1] = chosenColor.g;
				colors[i3 + 2] = chosenColor.b;
			}

			geometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
			geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

			const material = new THREE.PointsMaterial({
				size: 0.085,
				vertexColors: true,
				map: createGlowTexture(),
				transparent: true,
				opacity: 0.9,
				blending: THREE.AdditiveBlending,
				depthWrite: false,
			});

			particleSystem = new THREE.Points(geometry, material);
			particleSystem.position.x = 0; // Centered behind the Hero text stack
			particleSystem.position.y = 0;
			threeScene.add(particleSystem);

			// Mouse Move Tracking for 3D Parallax Tilt
			window.addEventListener('pointermove', (e) => {
				mouseXNorm = (e.clientX / window.innerWidth) * 2 - 1;
				mouseYNorm = -(e.clientY / window.innerHeight) * 2 + 1;
				targetRotY = mouseXNorm * 0.4;
				targetRotX = -mouseYNorm * 0.3;
			}, { passive: true });

			// Resize Handler
			window.addEventListener('resize', () => {
				if (!threeCamera || !threeRenderer) return;
				threeCamera.aspect = window.innerWidth / window.innerHeight;
				threeCamera.updateProjectionMatrix();
				threeRenderer.setSize(window.innerWidth, window.innerHeight);
				threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
			});

			// Render Loop with Organic Wave Perturbation
			// THREE.Clock is deprecated; elapsed seconds is all this loop needs.
			const startedAt = performance.now();

			// The sphere is a hero decoration, but the loop used to run for the
			// entire 6000px scroll — 3600 CPU-side position updates per frame
			// while the user reads the footer. Suspend it when the hero is gone.
			let heroInView = true;
			let rafId = null;

			const heroSection = document.getElementById('hero');
			if (heroSection && 'IntersectionObserver' in window) {
				new IntersectionObserver(
					(entries) => {
						entries.forEach((entry) => {
							if (entry.isIntersecting === heroInView) return;
							heroInView = entry.isIntersecting;
							if (heroInView && rafId === null) {
								animate3D();
							}
						});
					},
					{ rootMargin: '120px' }
				).observe(heroSection);
			}

			// Browsers already throttle rAF in background tabs, but this also
			// releases the GPU when the tab is hidden for a long time.
			document.addEventListener('visibilitychange', () => {
				if (document.hidden) {
					if (rafId !== null) cancelAnimationFrame(rafId);
					rafId = null;
				} else if (heroInView && rafId === null) {
					animate3D();
				}
			});

			const animate3D = () => {
				if (!heroInView || document.hidden) {
					rafId = null;
					return;
				}
				rafId = requestAnimationFrame(animate3D);
				const elapsedTime = (performance.now() - startedAt) / 1000;

				if (particleSystem) {
					// Inertial rotation
					particleSystem.rotation.y += 0.0025;
					particleSystem.rotation.x += (targetRotX - particleSystem.rotation.x) * 0.05;
					particleSystem.rotation.y += (targetRotY - particleSystem.rotation.y) * 0.05;

					// Gentle wave displacement
					const positions = particleSystem.geometry.attributes.position.array;
					for (let i = 0; i < particleCount; i++) {
						const i3 = i * 3;
						const bx = basePositions[i3];
						const by = basePositions[i3 + 1];
						const bz = basePositions[i3 + 2];

						const wave = Math.sin(elapsedTime * 1.4 + bx * 1.1 + by * 1.3) * 0.06;
						positions[i3] = bx + (bx / sphereRadius) * wave;
						positions[i3 + 1] = by + (by / sphereRadius) * wave;
						positions[i3 + 2] = bz + (bz / sphereRadius) * wave;
					}
					particleSystem.geometry.attributes.position.needsUpdate = true;

					// Scroll-driven position drift into the abyss
					const scrollY = window.scrollY || window.pageYOffset || 0;
					particleSystem.position.y = -scrollY * 0.0016;
					particleSystem.position.z = Math.sin(scrollY * 0.001) * 0.4;
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

		const interactiveEls = document.querySelectorAll('a, button, [data-magnetic="true"], [data-cursor-text], .project-item-card, .matrix-card, .timeline-card, .bento-box-tall-highlight, .bento-box-wide, .bento-box-small, .surface-card, .project-modal__backdrop, .project-modal__close');
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
				gsap.from('.hero-eyebrow', { y: 20, opacity: 0, duration: 0.6, ease: 'power2.out' });
				gsap.from('.hero-title', { y: 32, opacity: 0, duration: 0.8, delay: 0.15, ease: 'power3.out' });
				gsap.from('.hero-subtext', { y: 24, opacity: 0, duration: 0.7, delay: 0.3, ease: 'power2.out' });
				gsap.from('.hero-actions', { scale: 0.95, opacity: 0, duration: 0.6, delay: 0.45, ease: 'back.out(1.5)' });
				gsap.from('.hero-status-pill', { y: 16, opacity: 0, duration: 0.6, delay: 0.55, ease: 'power2.out' });
			}
		};

		if (document.documentElement.classList.contains('is-loaded')) {
			runHeroEntrance();
		} else {
			window.addEventListener('load', () => window.setTimeout(runHeroEntrance, 300), { once: true });
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
		'.bento-box-tall-highlight, .bento-box-wide, .bento-box-small, .matrix-card, .project-item-card, .timeline-card'
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
				lenis.scrollTo(targetId, { duration: 1.2, offset: -72 });
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
				if (lenis) lenis.scrollTo(initialHash, { offset: -72, immediate: true });
				else target.scrollIntoView();
			}, 100);
		}
	}

	// ==========================================================================
	// 6. Interactive 3D Perspective Card Tilt
	// ==========================================================================
	if (motionEnabled) {
		const tiltCards = document.querySelectorAll('.matrix-card, .timeline-card, .project-item-card, .surface-card, .bento-box-tall-highlight, .bento-box-wide, .bento-box-small');
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
	// 9. Velocity-Responsive Kinetic Footer Marquee
	// ==========================================================================
	if (lenis && motionEnabled) {
		const marqueeTrack = document.querySelector('.marquee-track');
		lenis.on('scroll', (e) => {
			const speed = Math.min(4, Math.max(0.5, 1 + Math.abs(e.velocity) * 0.04));
			if (marqueeTrack) {
				marqueeTrack.style.animationDuration = `${32 / speed}s`;
			}
		});
	}
});
