'use client';

import {
  useEffect,
  useRef,
  type JSX,
} from 'react';
import Image from 'next/image';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'framer-motion';

import {
  organicSpring,
  premiumEase,
} from '../../lib/motion';
import { useScrollContext } from '../ui/SmoothScroll';
import type { BentoItemProps } from './BentoCard';

export interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExitComplete: () => void;
  selectedItem: BentoItemProps | null;
}

function getFocusableElements(container: HTMLDivElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

export function ProjectModal({
  isOpen,
  onClose,
  onExitComplete,
  selectedItem,
}: ProjectModalProps): JSX.Element {
  const shouldReduceMotion = useReducedMotion();
  const { lenis } = useScrollContext();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (selectedItem === null) {
      return;
    }

    const previousActiveElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab' || dialogRef.current === null) {
        return;
      }

      const focusableElements = getFocusableElements(dialogRef.current);
      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);

      if (firstElement === undefined || lastElement === undefined) {
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.body.style.overflow = 'hidden';
    lenis?.stop();
    window.addEventListener('keydown', handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      lenis?.start();
      window.removeEventListener('keydown', handleKeyDown);
      previousActiveElement?.focus();
    };
  }, [lenis, onClose, selectedItem]);

  return (
    <AnimatePresence onExitComplete={onExitComplete}>
      {selectedItem !== null && isOpen ? (
        <motion.div
        aria-labelledby={`project-title-${selectedItem.id}`}
        aria-modal="true"
        className="fixed inset-0 z-[150] grid place-items-center p-4 sm:p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        transition={{ duration: shouldReduceMotion === true ? 0 : 0.2, ease: premiumEase }}
      >
        <div className="absolute inset-0 bg-surface-base/85 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          ref={dialogRef}
          className="relative z-10 flex max-h-[calc(100svh-2rem)] w-full max-w-6xl flex-col overflow-y-auto border bg-surface-elevated sm:max-h-[calc(100svh-4rem)]"
          data-lenis-prevent="true"
          layoutId={`project-card-${selectedItem.id}`}
          transition={organicSpring}
        >
          <div className="relative aspect-video overflow-hidden">
            <motion.div className="absolute inset-0" layoutId={`project-image-${selectedItem.id}`}>
              <Image
                alt=""
                className="object-cover"
                fill
                sizes="(max-width: 1023px) 100vw, 80vw"
                src={selectedItem.imageSrc}
              />
            </motion.div>
            <div className="absolute inset-0 bg-surface-base/55" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
              <p className="font-mono text-xs tracking-[0.16em] text-accent-cyan uppercase">
                {selectedItem.category}
              </p>
              <h2 id={`project-title-${selectedItem.id}`} className="mt-3 max-w-4xl text-4xl leading-[0.92] font-semibold tracking-[-0.06em] sm:text-6xl">
                {selectedItem.title}
              </h2>
            </div>
          </div>

          <div className="grid gap-8 p-6 sm:grid-cols-[1.5fr_1fr] sm:p-10">
            <p className="max-w-2xl text-lg leading-8 text-text-muted">
              {selectedItem.description}
            </p>
            <div>
              <p className="font-mono text-xs tracking-[0.16em] text-accent-emerald uppercase">
                System stack
              </p>
              <ul className="mt-4 flex flex-wrap gap-2" role="list">
                {selectedItem.tags.map((tag) => (
                  <li key={tag} className="border px-3 py-1 font-mono text-xs text-text-primary">
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            aria-label={`Close ${selectedItem.title}`}
            className="absolute top-4 right-4 z-20 grid size-11 place-items-center border bg-surface-base/80 text-text-primary transform-gpu transition-transform duration-200 hover:scale-95 focus-visible:scale-95"
            data-cursor-text="CLOSE"
            data-magnetic="true"
            onClick={onClose}
            type="button"
          >
            <svg fill="none" viewBox="0 0 24 24" className="size-5" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
            </svg>
          </button>
        </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
