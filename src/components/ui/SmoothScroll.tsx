'use client';

import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  useAnimationFrame,
  useMotionValue,
  type MotionValue,
} from 'framer-motion';

export interface ScrollContextValue {
  lenis: Lenis | null;
  scroll: MotionValue<number>;
  velocity: MotionValue<number>;
  direction: MotionValue<-1 | 0 | 1>;
}

const ScrollContext = createContext<ScrollContextValue | null>(null);

export function useScrollContext(): ScrollContextValue {
  const context = useContext(ScrollContext);

  if (context === null) {
    throw new Error('useScrollContext must be used within SmoothScroll.');
  }

  return context;
}

export interface SmoothScrollProps {
  children: ReactNode;
}

export function SmoothScroll({ children }: SmoothScrollProps): ReactNode {
  const lenisRef = useRef<Lenis | null>(null);
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const scroll = useMotionValue(0);
  const velocity = useMotionValue(0);
  const direction = useMotionValue<-1 | 0 | 1>(0);

  useAnimationFrame((time: number) => {
    lenisRef.current?.raf(time);
  });

  useEffect(() => {
    const instance = new Lenis({
      anchors: true,
      lerp: 0.1,
      respectReducedMotion: true,
      smoothWheel: true,
      stopInertiaOnNavigate: true,
    });

    lenisRef.current = instance;
    setLenis(instance);

    const handleScroll = (nextLenis: Lenis): void => {
      scroll.set(nextLenis.animatedScroll);
      velocity.set(nextLenis.velocity);
      direction.set(nextLenis.direction);
    };

    instance.on('scroll', handleScroll);

    return () => {
      instance.off('scroll', handleScroll);
      instance.destroy();
      lenisRef.current = null;
    };
  }, [direction, scroll, velocity]);

  const value = useMemo<ScrollContextValue>(
    () => ({ direction, lenis, scroll, velocity }),
    [direction, lenis, scroll, velocity],
  );

  return (
    <ScrollContext.Provider value={value}>{children}</ScrollContext.Provider>
  );
}
