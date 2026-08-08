'use client';

import {
  useState,
  type ReactNode,
} from 'react';
import {
  motion,
  useReducedMotion,
} from 'framer-motion';

import { premiumEase } from '../lib/motion';
import { CurtainReveal } from './ui/CurtainReveal';

export interface PortfolioShellProps {
  children: ReactNode;
}

export function PortfolioShell({ children }: PortfolioShellProps): ReactNode {
  const shouldReduceMotion = useReducedMotion();
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isRevealed ? 1 : 0 }}
        transition={{ duration: shouldReduceMotion === true ? 0 : 0.25, ease: premiumEase }}
      >
        {children}
      </motion.div>
      <CurtainReveal onComplete={() => setIsRevealed(true)} title="CHIRUDEVA REDDY" />
    </>
  );
}
