'use client';

import {
  useRef,
  type JSX,
} from 'react';
import {
  motion,
  useInView,
  useReducedMotion,
} from 'framer-motion';

import { organicSpring } from '../../lib/motion';
import {
  BentoCard,
  type BentoItemProps,
} from './BentoCard';

export interface BentoGridProps {
  items: BentoItemProps[];
}

export function BentoGrid({ items }: BentoGridProps): JSX.Element {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(gridRef, { amount: 0.15, once: true });
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="projects" className="px-6 py-24 sm:px-10 sm:py-32 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 border-b pb-10 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="font-mono text-xs tracking-[0.18em] text-accent-emerald uppercase">
              Selected engineering systems
            </p>
            <h2 className="mt-4 max-w-3xl text-4xl leading-[0.92] font-semibold tracking-[-0.06em] sm:text-6xl lg:text-7xl">
              Research with a{' '}
              <span className="font-editorial ml-3 font-normal italic text-accent-cyan">working edge.</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-text-muted sm:text-right">
            Four systems across computer vision, natural-language processing, data science, and robotics.
          </p>
        </div>

        <div ref={gridRef} className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3 sm:gap-6">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              className="transform-gpu will-change-transform"
              initial={{ opacity: 0, y: 60 }}
              animate={isInView || shouldReduceMotion === true ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
              transition={shouldReduceMotion === true
                ? { duration: 0 }
                : { ...organicSpring, delay: index * 0.1 }}
            >
              <BentoCard item={item} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
