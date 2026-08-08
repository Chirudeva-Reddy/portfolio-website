import type { JSX } from 'react';
import Image from 'next/image';

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
}

const sizeClasses: Record<BentoItemProps['size'], string> = {
  full: 'md:col-span-3',
  small: 'md:col-span-1',
  wide: 'md:col-span-2',
};

export function BentoCard({ item }: BentoCardProps): JSX.Element {
  return (
    <article className={`group relative min-h-96 overflow-hidden border bg-surface-elevated ${sizeClasses[item.size]}`}>
      <Image
        alt=""
        className="object-cover grayscale"
        fill
        sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
        src={item.imageSrc}
      />
      <div className="absolute inset-0 bg-surface-base/60" />

      <div className="relative flex min-h-96 flex-col justify-end p-6 sm:p-8">
        <p className="font-mono text-xs tracking-[0.16em] text-accent-cyan uppercase">
          {item.category}
        </p>
        <h3 className="mt-3 max-w-xl text-3xl leading-none font-semibold tracking-[-0.05em] sm:text-4xl">
          {item.title}
        </h3>
        <p className="mt-4 max-w-xl text-sm leading-6 text-text-muted sm:text-base">
          {item.description}
        </p>
      </div>
    </article>
  );
}
