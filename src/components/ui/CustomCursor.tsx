'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

import { organicSpring } from '../../lib/motion';
import { useCustomCursor } from './useCustomCursor';

export function CustomCursor(): ReactNode {
  const {
    cursorText,
    dotX,
    dotY,
    isFinePointer,
    isMagnetic,
    isVisible,
    ringX,
    ringY,
    shouldReduceMotion,
  } = useCustomCursor();

  if (!isFinePointer || shouldReduceMotion === true) {
    return null;
  }

  const ringScale = isMagnetic ? cursorText === null ? 1.8 : 2.6 : 1;
  const cursorClassName = isVisible ? 'will-change-transform' : '';

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      <motion.svg
        className={`fixed top-0 left-0 h-[30px] w-[30px] transform-gpu mix-blend-difference ${cursorClassName}`}
        viewBox="0 0 30 30"
        style={{ x: ringX, y: ringY, translateX: '-50%', translateY: '-50%' }}
        animate={{ opacity: isVisible ? 1 : 0, scale: ringScale }}
        transition={organicSpring}
      >
        <circle cx="15" cy="15" r="14" fill="none" stroke="currentColor" strokeWidth="1" />
        {cursorText !== null ? (
          <text
            x="15"
            y="16.25"
            fill="currentColor"
            fontSize="3.4"
            fontWeight="700"
            letterSpacing="0.35"
            textAnchor="middle"
          >
            {cursorText}
          </text>
        ) : null}
      </motion.svg>

      <motion.svg
        className={`fixed top-0 left-0 h-2 w-2 transform-gpu mix-blend-difference ${cursorClassName}`}
        viewBox="0 0 8 8"
        style={{ x: dotX, y: dotY, translateX: '-50%', translateY: '-50%' }}
        animate={{ opacity: isVisible ? 1 : 0 }}
        transition={organicSpring}
      >
        <circle cx="4" cy="4" r="4" fill="currentColor" />
      </motion.svg>
    </div>
  );
}
