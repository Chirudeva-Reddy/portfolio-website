import type { Transition } from 'framer-motion';

export const premiumEase = [0.76, 0, 0.24, 1] as const;

export const organicSpring: Transition = {
  damping: 20,
  mass: 0.5,
  stiffness: 150,
  type: 'spring',
};
