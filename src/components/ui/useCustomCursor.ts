'use client';

import {
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  useMotionValue,
  useReducedMotion,
  useSpring,
  type MotionValue,
} from 'framer-motion';

import { organicSpring } from '../../lib/motion';

interface CursorPoint {
  x: number;
  y: number;
}

export interface CustomCursorController {
  cursorText: string | null;
  dotX: MotionValue<number>;
  dotY: MotionValue<number>;
  isFinePointer: boolean;
  isMagnetic: boolean;
  isVisible: boolean;
  ringX: MotionValue<number>;
  ringY: MotionValue<number>;
  shouldReduceMotion: boolean | null;
}

const cursorLerp = 0.1;
const defaultCursorPoint: CursorPoint = { x: -100, y: -100 };

function getTargetCenter(target: HTMLElement): CursorPoint {
  const rect = target.getBoundingClientRect();

  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

export function useCustomCursor(): CustomCursorController {
  const shouldReduceMotion = useReducedMotion();
  const [isFinePointer, setIsFinePointer] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMagnetic, setIsMagnetic] = useState(false);
  const [cursorText, setCursorText] = useState<string | null>(null);
  const dotTargetRef = useRef<CursorPoint>(defaultCursorPoint);
  const dotCurrentRef = useRef<CursorPoint>(defaultCursorPoint);
  const magneticTargetRef = useRef<HTMLElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dotX = useMotionValue(defaultCursorPoint.x);
  const dotY = useMotionValue(defaultCursorPoint.y);
  const ringTargetX = useMotionValue(defaultCursorPoint.x);
  const ringTargetY = useMotionValue(defaultCursorPoint.y);
  const ringX = useSpring(ringTargetX, organicSpring);
  const ringY = useSpring(ringTargetY, organicSpring);

  useEffect(() => {
    const pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

    const syncPointerCapability = (): void => {
      setIsFinePointer(pointerQuery.matches);

      if (!pointerQuery.matches) {
        setIsVisible(false);
        setIsMagnetic(false);
        setCursorText(null);
        magneticTargetRef.current = null;
      }
    };

    syncPointerCapability();
    pointerQuery.addEventListener('change', syncPointerCapability);

    return () => {
      pointerQuery.removeEventListener('change', syncPointerCapability);
    };
  }, []);

  useEffect(() => {
    if (!isFinePointer || shouldReduceMotion === true) {
      return;
    }

    const updateMagneticCenter = (): void => {
      const target = magneticTargetRef.current;

      if (target === null || !target.isConnected) {
        return;
      }

      const center = getTargetCenter(target);
      ringTargetX.set(center.x);
      ringTargetY.set(center.y);
    };

    const clearMagneticTarget = (): void => {
      magneticTargetRef.current = null;
      setIsMagnetic(false);
      setCursorText(null);
    };

    const animateCursor = (): void => {
      const nextX = dotCurrentRef.current.x + (dotTargetRef.current.x - dotCurrentRef.current.x) * cursorLerp;
      const nextY = dotCurrentRef.current.y + (dotTargetRef.current.y - dotCurrentRef.current.y) * cursorLerp;

      dotCurrentRef.current = { x: nextX, y: nextY };
      dotX.set(nextX);
      dotY.set(nextY);

      if (magneticTargetRef.current === null) {
        ringTargetX.set(nextX);
        ringTargetY.set(nextY);
      }

      const hasRemainingDistance = Math.abs(dotTargetRef.current.x - nextX) > 0.1
        || Math.abs(dotTargetRef.current.y - nextY) > 0.1;

      animationFrameRef.current = hasRemainingDistance
        ? window.requestAnimationFrame(animateCursor)
        : null;
    };

    const scheduleCursorFrame = (): void => {
      if (animationFrameRef.current === null) {
        animationFrameRef.current = window.requestAnimationFrame(animateCursor);
      }
    };

    const handlePointerMove = (event: PointerEvent): void => {
      dotTargetRef.current = { x: event.clientX, y: event.clientY };
      setIsVisible(true);
      scheduleCursorFrame();
    };

    const handlePointerOver = (event: PointerEvent): void => {
      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>('[data-magnetic="true"]')
        : null;

      if (target === magneticTargetRef.current) {
        return;
      }

      if (target === null) {
        clearMagneticTarget();
        return;
      }

      magneticTargetRef.current = target;
      setIsMagnetic(true);
      setCursorText(target.dataset.cursorText ?? null);
      updateMagneticCenter();
    };

    const handlePointerOut = (event: PointerEvent): void => {
      if (event.relatedTarget === null) {
        clearMagneticTarget();
        setIsVisible(false);
      }
    };

    const handleWindowBlur = (): void => {
      clearMagneticTarget();
      setIsVisible(false);
    };

    document.documentElement.classList.add('has-custom-cursor');
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerover', handlePointerOver, { passive: true });
    window.addEventListener('pointerout', handlePointerOut, { passive: true });
    window.addEventListener('resize', updateMagneticCenter, { passive: true });
    window.addEventListener('scroll', updateMagneticCenter, { passive: true });
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.documentElement.classList.remove('has-custom-cursor');
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerover', handlePointerOver);
      window.removeEventListener('pointerout', handlePointerOut);
      window.removeEventListener('resize', updateMagneticCenter);
      window.removeEventListener('scroll', updateMagneticCenter);
      window.removeEventListener('blur', handleWindowBlur);

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [dotX, dotY, isFinePointer, ringTargetX, ringTargetY, shouldReduceMotion]);

  return {
    cursorText,
    dotX,
    dotY,
    isFinePointer,
    isMagnetic,
    isVisible,
    ringX,
    ringY,
    shouldReduceMotion,
  };
}
