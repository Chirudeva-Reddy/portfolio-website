import type { JSX } from 'react';

import { PortfolioShell } from '../src/components/PortfolioShell';
import { BentoGrid } from '../src/components/sections/BentoGrid';
import { projects } from '../src/data/projects';

export default function HomePage(): JSX.Element {
  return (
    <PortfolioShell>
      <main>
        <section className="grid min-h-svh place-items-center px-6 py-16 sm:px-10">
          <div className="max-w-4xl border-y py-10 sm:py-16">
            <p className="font-mono text-xs tracking-[0.2em] text-accent-cyan uppercase">
              Chirudeva Reddy Butukuri / Portfolio
            </p>
            <h1 className="mt-5 max-w-3xl text-5xl leading-[0.9] font-semibold tracking-[-0.06em] text-balance sm:text-7xl lg:text-8xl">
              Architecting intelligent vision and scalable ML engines.
            </h1>
            <p className="mt-8 max-w-xl text-base leading-7 text-text-muted sm:text-lg">
              Computer Science scholar building privacy-preserving computer vision, NLP systems, and high-throughput machine-learning infrastructure.
            </p>
          </div>
        </section>
        <BentoGrid items={projects} />
      </main>
    </PortfolioShell>
  );
}
