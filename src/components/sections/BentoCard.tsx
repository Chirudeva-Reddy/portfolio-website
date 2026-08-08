'use client';

import {
  useState,
  type JSX,
} from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

import { organicSpring } from '../../lib/motion';

export interface BentoItemProps {
  category: string;
  description: string;
  id: string;
  imageSrc: string;
  magneticText: string;
  size: 'small' | 'wide' | 'full';
  tags: string[];
  title: string;
}

export interface BentoCardProps {
  item: BentoItemProps;
  onSelect: (item: BentoItemProps) => void;
}

const sizeClasses: Record<BentoItemProps['size'], string> = {
  full: 'md:col-span-3',
  small: 'md:col-span-1',
  wide: 'md:col-span-2',
};

export function BentoCard({ item, onSelect }: BentoCardProps): JSX.Element {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isActive = isFocused || isHovered;

  return (
    <motion.article
      className={`group relative min-h-96 w-full overflow-hidden border bg-surface-elevated text-left ${sizeClasses[item.size]}`}
      layoutId={`project-card-${item.id}`}
      onBlur={() => setIsFocused(false)}
      onFocus={() => setIsFocused(true)}
      onHoverEnd={() => setIsHovered(false)}
      onHoverStart={() => setIsHovered(true)}
      transition={organicSpring}
    >
      <motion.div
        className="absolute inset-0 transform-gpu will-change-transform"
        layoutId={`project-image-${item.id}`}
        animate={{ scale: isActive ? 1.05 : 1 }}
        transition={organicSpring}
      >
        <Image
          alt=""
          className="object-cover grayscale transition-[filter] duration-500 group-hover:grayscale-0 group-focus-visible:grayscale-0"
          fill
          sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
          src={item.imageSrc}
        />
      </motion.div>
      <div className="absolute inset-0 bg-surface-base/60" />

      <div className="pointer-events-none relative flex min-h-96 flex-col justify-between p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <p className="font-mono text-xs tracking-[0.16em] text-accent-cyan uppercase">
            {item.category}
          </p>
          <motion.span
            aria-hidden="true"
            className="grid size-10 shrink-0 place-items-center border bg-surface-base/70 text-text-primary transform-gpu will-change-transform"
            animate={{ opacity: isActive ? 1 : 0, x: isActive ? 0 : -8 }}
            transition={organicSpring}
          >
            <svg fill="none" viewBox="0 0 24 24" className="size-4" aria-hidden="true">
              <path d="M5 12h13m-6-6 6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            </svg>
          </motion.span>
        </div>

        <div>
          <h3 className="max-w-xl text-3xl leading-none font-semibold tracking-[-0.05em] sm:text-4xl">
            <motion.span
              className="inline-block transform-gpu will-change-transform"
              animate={{ x: isActive ? 8 : 0 }}
              transition={organicSpring}
            >
              {item.title}
            </motion.span>
          </h3>
          <p className="mt-4 max-w-xl text-sm leading-6 text-text-muted sm:text-base">
            {item.description}
          </p>
        </div>
      </div>
      <button
        aria-haspopup="dialog"
        aria-label={`Open project: ${item.title}`}
        className="absolute inset-0 z-10 cursor-pointer"
        data-cursor-text={item.magneticText}
        data-magnetic="true"
        onClick={() => onSelect(item)}
        type="button"
      />
    </motion.article>
  );
}
