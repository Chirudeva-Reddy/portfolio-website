'use client';

import {
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'framer-motion';

import { premiumEase } from '../../lib/motion';

export interface CurtainRevealProps {
  onComplete: () => void;
  title: string;
}

const curtainPath = {
  closed: 'M0 0 H1440 V900 C1080 820 360 980 0 860 Z',
  open: 'M0 0 H1440 V220 C1050 300 420 80 0 170 Z',
  removed: 'M0 0 H1440 V0 C960 0 480 0 0 0 Z',
};

export function CurtainReveal({ onComplete, title }: CurtainRevealProps): ReactNode {
  const shouldReduceMotion = useReducedMotion();
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [isLocked, setIsLocked] = useState(true);
  const characters = Array.from(title);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isLocked) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isLocked]);

  if (!isMounted) {
    return null;
  }

  const motionDuration = shouldReduceMotion === true ? 0 : 1.2;
  const characterDuration = shouldReduceMotion === true ? 0 : 0.65;

  const handleExitComplete = (): void => {
    setIsLocked(false);
    onComplete();
  };

  return createPortal(
    <AnimatePresence onExitComplete={handleExitComplete}>
      {isOpen ? (
        <motion.div
          aria-hidden="true"
          className="fixed inset-0 z-[200] grid place-items-center overflow-hidden bg-surface-base text-text-primary"
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduceMotion === true ? 0 : 0.2, ease: premiumEase }}
        >
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 1440 900"
            preserveAspectRatio="none"
          >
            <motion.path
              fill="var(--surface-elevated)"
              initial={{ d: curtainPath.closed }}
              animate={{ d: [curtainPath.closed, curtainPath.open, curtainPath.removed] }}
              transition={{
                duration: motionDuration,
                ease: premiumEase,
                times: [0, 0.72, 1],
              }}
              onAnimationComplete={() => setIsOpen(false)}
            />
          </svg>

          <p className="relative flex max-w-[90vw] overflow-hidden text-center text-4xl leading-none font-semibold tracking-[-0.06em] text-balance uppercase sm:text-6xl lg:text-8xl">
            {characters.map((character, index) => (
              <span key={`${character}-${index}`} className="inline-block overflow-hidden">
                <motion.span
                  className="inline-block transform-gpu will-change-transform"
                  initial={{ y: '100%' }}
                  animate={{ y: '0%' }}
                  transition={{
                    delay: shouldReduceMotion === true ? 0 : index * 0.025,
                    duration: characterDuration,
                    ease: premiumEase,
                  }}
                >
                  {character === ' ' ? '\u00a0' : character}
                </motion.span>
              </span>
            ))}
          </p>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
