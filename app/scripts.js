import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger.js';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {
	console.log('⚡ Chirudeva Reddy Portfolio Architecture Initialized.');

	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const hasCoarsePointer = window.matchMedia('(hover: none), (pointer: coarse)').matches;
	const motionEnabled = !prefersReducedMotion && !hasCoarsePointer;
	if (!motionEnabled) document.documentElement.classList.add('motion-reduced');

	// 1. Single-Loop Lenis Smooth Scroll Synced with GSAP Ticker & Lax.js
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

	// 2. Lax.js Scroll-Driven Inertia & 3D Pitch-Unfold Setup
	if (typeof window.lax !== 'undefined' && motionEnabled) {
		window.lax.init();
		if (!window.lax.update) window.lax.update = function () {};
		window.lax.addDriver('scrollY', function () {
			return window.scrollY;
		}, { inertiaEnabled: true });

		// Removed Lax.js .about-card-skewed bindings to use GSAP Horizontal Slice-In
	}

	// 2.5 GSAP Horizontal Slice-In Transition for About Card
	if (motionEnabled) {
		const aboutCard = document.querySelector('.about-card-skewed');
		if (aboutCard) {
			gsap.fromTo(aboutCard,
				{
					clipPath: 'polygon(0% 0%, 0% 0%, 0% calc(100% - 32px), 0% 100%, 0% 100%)',
					x: -120,
					opacity: 0,
					filter: 'blur(12px)'
				},
				{
					clipPath: 'polygon(0% 0%, 100% 0%, 100% calc(100% - 32px), calc(100% - 32px) 100%, 0% 100%)',
					x: 0,
					opacity: 1,
					filter: 'blur(0px)',
					ease: 'none',
					scrollTrigger: {
						trigger: '#about',
						start: 'top 85%',
						end: 'center center',
						scrub: 1.2
					}
				}
			);
		}
	}

	// 3. Custom Cursor Follower & Mouse Tracking
	const cursorDot = motionEnabled ? document.querySelector('.cursor-dot') : null;
	const cursorRing = motionEnabled ? document.querySelector('.cursor-ring') : null;
	const cursorLabel = motionEnabled ? document.querySelector('.cursor-label') : null;
	let mouseX = window.innerWidth / 2;
	let mouseY = window.innerHeight / 2;
	let targetMouseX = mouseX;
	let targetMouseY = mouseY;
	let magneticTarget = null;
	let rafId = 0;

	const renderCursor = () => {
		mouseX += (targetMouseX - mouseX) * 0.1;
		mouseY += (targetMouseY - mouseY) * 0.1;
		if (cursorDot) cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
		if (cursorRing) {
			const ringX = magneticTarget ? magneticTarget.x : mouseX;
			const ringY = magneticTarget ? magneticTarget.y : mouseY;
			cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
			if (cursorLabel) cursorLabel.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
		}
		rafId = requestAnimationFrame(renderCursor);
	};

	if (motionEnabled) {
		window.addEventListener('mousemove', (e) => {
			targetMouseX = e.clientX;
			targetMouseY = e.clientY;
		});
		rafId = requestAnimationFrame(renderCursor);
	}

	const interactiveElements = document.querySelectorAll('[data-magnetic="true"], .magnetic, a, button, .project-cover, .skill-card, .tech-card, .timeline__card, .stat-box');
	if (motionEnabled) {
		interactiveElements.forEach((el) => {
			el.addEventListener('mouseenter', () => {
				document.body.classList.add('cursor-hover');
				const rect = el.getBoundingClientRect();
				magneticTarget = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
				if (cursorLabel) cursorLabel.textContent = el.getAttribute('data-cursor-text') || '';
			});
			el.addEventListener('mouseleave', () => {
				document.body.classList.remove('cursor-hover');
				magneticTarget = null;
				if (cursorLabel) cursorLabel.textContent = '';
			});
		});
	}

	// 4. Project Modal Component Logic
	const projectModal = document.getElementById('project-modal');
	const modalTitle = document.getElementById('project-modal-title');
	const modalCategory = document.getElementById('project-modal-category');
	const modalDescription = document.getElementById('project-modal-description');
	const modalIndex = document.getElementById('project-modal-index');
	const modalGithub = document.getElementById('project-modal-github');
	const modalPanel = projectModal?.querySelector('.project-modal__panel');
	const projectCardsForModal = document.querySelectorAll('.project-cover');
	let lastFocusedProject = null;

	const openProjectModal = (card) => {
		if (!projectModal || !modalTitle || !modalCategory || !modalDescription || !modalIndex) return;
		lastFocusedProject = card;
		modalTitle.textContent = card.querySelector('h3')?.textContent || 'Project';
		modalCategory.textContent = card.querySelector('.project-category')?.textContent || 'Project';
		modalDescription.textContent = card.querySelector('.project-cover__bar p')?.textContent || '';
		modalIndex.textContent = `CASE STUDY 0${Number(card.getAttribute('data-project') || 0) + 1}`;
		if (modalGithub) {
			const githubUrl = card.getAttribute('data-github') || 'https://github.com/Chirudeva-Reddy';
			modalGithub.setAttribute('href', githubUrl);
		}
		projectModal.classList.add('is-open');
		projectModal.setAttribute('aria-hidden', 'false');
		document.body.classList.add('modal-open');
		if (lenis) lenis.stop();
		modalPanel?.focus();
	};

	const closeProjectModal = () => {
		if (!projectModal) return;
		projectModal.classList.remove('is-open');
		projectModal.setAttribute('aria-hidden', 'true');
		document.body.classList.remove('modal-open');
		if (lenis) lenis.start();
		lastFocusedProject?.focus();
	};

	projectCardsForModal.forEach((card) => {
		card.addEventListener('click', () => openProjectModal(card));
		card.addEventListener('keydown', (event) => {
			if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openProjectModal(card); }
		});
	});

	projectModal?.querySelectorAll('[data-modal-close]').forEach((element) => element.addEventListener('click', closeProjectModal));
	document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeProjectModal(); });
	projectModal?.addEventListener('keydown', (event) => {
		if (event.key !== 'Tab') return;
		const focusable = Array.from(projectModal.querySelectorAll('button, [tabindex]:not([tabindex="-1"])')).filter((element) => !element.hasAttribute('disabled'));
		if (focusable.length === 0) return;
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
		if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
	});

	// 5. Asymmetric Shatter Break-Apart Landing Panel Transition
	const landingPanel = document.getElementById('landing-panel');
	const shatterCurtain = document.querySelector('.shatter-curtain');
	let isLandingDismissed = false;

	if (landingPanel && motionEnabled) {
		const landingTl = gsap.timeline({
			scrollTrigger: {
				trigger: landingPanel,
				start: 'top top',
				end: '+=900',
				pin: true,
				scrub: 0.6,
				onUpdate: (self) => {
					if (self.progress > 0.05) {
						document.body.classList.remove('landing-active');
					} else {
						document.body.classList.add('landing-active');
					}
					if (self.progress > 0.95 && !isLandingDismissed) {
						isLandingDismissed = true;
						landingPanel.classList.add('is-dismissed');
					} else if (self.progress <= 0.95 && isLandingDismissed) {
						isLandingDismissed = false;
						landingPanel.classList.remove('is-dismissed');
					}
				}
			}
		});

		landingTl
			.to('.landing-panel__copy', {
				xPercent: -50,
				yPercent: -35,
				rotate: -14,
				opacity: 0,
				filter: 'blur(12px)',
				ease: 'power2.inOut'
			}, 0)
			.to('.landing-panel__image', {
				xPercent: 55,
				yPercent: 45,
				rotate: 20,
				scale: 0.72,
				opacity: 0,
				filter: 'blur(10px)',
				ease: 'power2.inOut'
			}, 0)
			.to(shatterCurtain, {
				opacity: 1,
				clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)',
				ease: 'power3.inOut'
			}, 0);

		const dismissLandingBtn = landingPanel.querySelector('.landing-panel__enter');
		dismissLandingBtn?.addEventListener('click', () => {
			if (lenis) {
				lenis.scrollTo('#about', { duration: 1.3, offset: 0 });
			} else {
				document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
			}
		});
	} else if (landingPanel) {
		const dismissLandingBtn = landingPanel.querySelector('.landing-panel__enter');
		dismissLandingBtn?.addEventListener('click', () => {
			landingPanel.classList.add('is-dismissed');
			landingPanel.style.display = 'none';
			document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
		});
	}

	// 6. About Card Internal Staggered Reveal Timeline
	if (motionEnabled) {
		const aboutCardHeader = document.querySelector('.about-card__header');
		const aboutStatBoxes = document.querySelectorAll('.about-card .stat-box');
		const aboutBioParagraphs = document.querySelectorAll('.about-card__bio p');

		if (aboutCardHeader || aboutStatBoxes.length > 0) {
			const aboutTl = gsap.timeline({
				scrollTrigger: {
					trigger: '#about',
					start: 'top 75%',
					toggleActions: 'play none none reverse'
				}
			});

			if (aboutCardHeader) {
				aboutTl.fromTo(
					aboutCardHeader,
					{ opacity: 0, y: -25 },
					{ opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' },
					0
				);
			}

			if (aboutStatBoxes.length > 0) {
				aboutTl.fromTo(
					aboutStatBoxes,
					{ opacity: 0, scale: 0.88, y: 30 },
					{
						opacity: 1,
						scale: 1,
						y: 0,
						duration: 0.65,
						stagger: 0.08,
						ease: 'back.out(1.6)'
					},
					0.15
				);
			}

			if (aboutBioParagraphs.length > 0) {
				aboutTl.fromTo(
					aboutBioParagraphs,
					{ opacity: 0, y: 25 },
					{
						opacity: 1,
						y: 0,
						duration: 0.7,
						stagger: 0.12,
						ease: 'power3.out'
					},
					0.35
				);
			}
		}
	}

	// 7. Preloader Progress Counter & Initial Stagger Entrance
	const preloader = document.getElementById('preloader');
	const preloaderBar = document.getElementById('preloader-bar');
	const preloaderCounter = document.getElementById('preloader-counter');

	if (preloader && preloaderBar && preloaderCounter && !prefersReducedMotion) {
		let count = 0;
		const interval = setInterval(() => {
			count += Math.floor(Math.random() * 4) + 1;
			if (count >= 100) {
				count = 100;
				clearInterval(interval);
				preloaderBar.style.transform = 'scaleX(1)';
				preloaderCounter.textContent = '100%';

				setTimeout(() => {
					preloader.classList.add('preloader--loaded');
					preloader.style.pointerEvents = 'none';
					ScrollTrigger.refresh();

					// Hero Entrance Stagger
					if (motionEnabled) {
						gsap.from('.landing-panel__copy .hero-tag', { y: 20, opacity: 0, duration: 0.6, ease: 'power2.out' });
						gsap.from('.landing-panel__copy h1', { y: 35, opacity: 0, duration: 0.8, delay: 0.15, ease: 'power3.out' });
						gsap.from('.slant-italic', { rotate: -6, opacity: 0, duration: 0.8, delay: 0.25, ease: 'back.out(1.7)' });
						gsap.from('.landing-panel__copy p', { y: 25, opacity: 0, duration: 0.7, delay: 0.3, ease: 'power2.out' });
						gsap.from('.landing-panel__enter', { scale: 0.9, opacity: 0, duration: 0.6, delay: 0.45, ease: 'back.out(1.5)' });
						gsap.from('.landing-panel__image', { x: 40, opacity: 0, scale: 0.95, duration: 0.9, delay: 0.2, ease: 'power3.out' });
					}
				}, 600);
			} else {
				preloaderBar.style.transform = `scaleX(${count / 100})`;
				preloaderCounter.textContent = `${count}%`;
			}
		}, 40);
	} else if (preloader) {
		preloader.classList.add('preloader--loaded');
		preloader.style.pointerEvents = 'none';
	}

	// 8. Header Navigation Link Smooth Scroll & ScrollSpy
	const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
	navLinks.forEach((link) => {
		link.addEventListener('click', (e) => {
			const targetId = link.getAttribute('href');
			if (!targetId || targetId === '#') return;
			e.preventDefault();

			const dest = (targetId === '#hero' || targetId === '#landing-panel') ? '#landing-panel' : targetId;

			if (lenis) {
				lenis.scrollTo(dest, { duration: 1.2, offset: 0 });
			} else {
				document.querySelector(dest)?.scrollIntoView({ behavior: 'smooth' });
			}
		});
	});

	if (motionEnabled) {
		const sections = ['landing-panel', 'about', 'tech', 'projects', 'experience'];
		sections.forEach((id) => {
			const sec = document.getElementById(id);
			if (!sec) return;
			ScrollTrigger.create({
				trigger: sec,
				start: 'top 45%',
				end: 'bottom 45%',
				onToggle: (self) => {
					if (self.isActive) {
						navLinks.forEach((a) => {
							const href = a.getAttribute('href');
							const match = (href === '#hero' || href === '#landing-panel') ? 'landing-panel' : href?.replace('#', '');
							a.classList.toggle('active', match === id);
						});
					}
				}
			});
		});
	}

	// 9. Hero Canvas Animated Ambient Blobs & Cursor Tracking Spotlight
	const canvas = document.getElementById('hero-canvas');
	if (canvas && motionEnabled) {
		const ctx = canvas.getContext('2d');
		let width = (canvas.width = window.innerWidth);
		let height = (canvas.height = window.innerHeight);

		window.addEventListener('resize', () => {
			width = canvas.width = window.innerWidth;
			height = canvas.height = window.innerHeight;
		});

		const ambientBlobs = [
			{ x: width * 0.2, y: height * 0.3, r: 380, vx: 0.4, vy: 0.25, color: 'rgba(0, 242, 254, 0.04)' },
			{ x: width * 0.8, y: height * 0.7, r: 420, vx: -0.3, vy: -0.4, color: 'rgba(0, 230, 153, 0.035)' },
			{ x: width * 0.5, y: height * 0.5, r: 320, vx: 0.25, vy: -0.3, color: 'rgba(0, 230, 153, 0.035)' }
		];

		function animateCanvas() {
			ctx.clearRect(0, 0, width, height);

			ambientBlobs.forEach((b) => {
				b.x += b.vx;
				b.y += b.vy;

				if (b.x < -100 || b.x > width + 100) b.vx *= -1;
				if (b.y < -100 || b.y > height + 100) b.vy *= -1;

				const gradient = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
				gradient.addColorStop(0, b.color);
				gradient.addColorStop(1, 'transparent');

				ctx.fillStyle = gradient;
				ctx.beginPath();
				ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
				ctx.fill();
			});

			const cursorLight = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 500);
			cursorLight.addColorStop(0, 'rgba(210, 225, 240, 0.09)');
			cursorLight.addColorStop(0.3, 'rgba(150, 168, 190, 0.04)');
			cursorLight.addColorStop(0.7, 'rgba(90, 105, 125, 0.015)');
			cursorLight.addColorStop(1, 'transparent');

			ctx.fillStyle = cursorLight;
			ctx.beginPath();
			ctx.arc(mouseX, mouseY, 500, 0, Math.PI * 2);
			ctx.fill();

			requestAnimationFrame(animateCanvas);
		}
		animateCanvas();
	}

	// 10. Projects Horizontal Pinned Track Movement (GSAP ScrollTrigger)
	const projectsSection = document.getElementById('projects');
	const projectCards = document.querySelector('.project-cards');
	const projectCounter = document.getElementById('project-num');

	if (projectsSection && projectCards && motionEnabled) {
		const getScrollDistance = () => projectCards.scrollWidth - window.innerWidth + 140;

		gsap.to(projectCards, {
			x: () => -getScrollDistance(),
			ease: 'none',
			scrollTrigger: {
				trigger: projectsSection,
				start: 'top top',
				end: () => `+=${getScrollDistance()}`,
				pin: true,
				scrub: 1,
				invalidateOnRefresh: true,
				onUpdate: (self) => {
					const idx = Math.min(4, Math.max(1, Math.ceil(self.progress * 4)));
					if (projectCounter) {
						projectCounter.textContent = `0${idx} / 04`;
					}
				}
			}
		});

		window.addEventListener('resize', () => ScrollTrigger.refresh());
	}

	// 11. Interactive 3D Card Perspective Tilt
	if (motionEnabled) {
		const tiltCards = document.querySelectorAll('.skill-card, .tech-card, .timeline__card, .stat-box, .about-card');
		tiltCards.forEach((card) => {
			card.addEventListener('mousemove', (e) => {
				const rect = card.getBoundingClientRect();
				const x = e.clientX - rect.left - rect.width / 2;
				const y = e.clientY - rect.top - rect.height / 2;
				const rotateX = (y / (rect.height / 2)) * -6;
				const rotateY = (x / (rect.width / 2)) * 6;
				card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
			});
			card.addEventListener('mouseleave', () => {
				card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
				card.style.transition = 'transform 0.5s ease';
			});
			card.addEventListener('mouseenter', () => {
				card.style.transition = 'none';
			});
		});
	}

	// 12. GSAP ScrollTrigger Animations for Experience Timeline Cards & Skills Grid
	if (motionEnabled) {
		// Skills Grid Staggered Reveal
		const skillCards = document.querySelectorAll('.skill-card');
		if (skillCards.length > 0) {
			gsap.fromTo(
				skillCards,
				{ opacity: 0, y: 40, scale: 0.94 },
				{
					opacity: 1,
					y: 0,
					scale: 1,
					duration: 0.7,
					stagger: 0.08,
					ease: 'power3.out',
					scrollTrigger: {
						trigger: '.skills-grid',
						start: 'top 85%',
						toggleActions: 'play none none reverse'
					}
				}
			);
		}

		// Experience Timeline Left/Right Alternating Reveal
		const timelineItems = document.querySelectorAll('.timeline__item');
		timelineItems.forEach((item, index) => {
			const isEven = index % 2 === 0;
			const card = item.querySelector('.timeline__card');
			if (card) {
				gsap.fromTo(
					card,
					{ opacity: 0, x: isEven ? -60 : 60, scale: 0.94 },
					{
						opacity: 1,
						x: 0,
						scale: 1,
						duration: 0.85,
						ease: 'power3.out',
						scrollTrigger: {
							trigger: item,
							start: 'top 85%',
							toggleActions: 'play none none reverse'
						}
					}
				);
			}
		});
	}

	// 13. Kinetic Staggered Scroll-Reveal Animations (.anim-reveal)
	const revealElements = document.querySelectorAll('.anim-reveal');
	if (motionEnabled && revealElements.length > 0) {
		revealElements.forEach((el) => {
			gsap.fromTo(
				el,
				{ opacity: 0, y: 35 },
				{
					opacity: 1,
					y: 0,
					duration: 0.8,
					ease: 'power3.out',
					scrollTrigger: {
						trigger: el,
						start: 'top 88%',
						toggleActions: 'play none none reverse',
					},
				}
			);
		});
	} else {
		revealElements.forEach((el) => el.classList.add('is-visible'));
	}

	// 14. Scroll Velocity Acceleration for Footer Marquee
	if (lenis && motionEnabled) {
		const marqueeLeft = document.querySelector('.marquee-left .marquee-content');
		const marqueeRight = document.querySelector('.marquee-right .marquee-content');

		lenis.on('scroll', (e) => {
			const speed = Math.min(4, Math.max(0.5, 1 + Math.abs(e.velocity) * 0.04));
			if (marqueeLeft) marqueeLeft.style.animationDuration = `${25 / speed}s`;
			if (marqueeRight) marqueeRight.style.animationDuration = `${25 / speed}s`;
		});
	}
});
