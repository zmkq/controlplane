'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
} from 'framer-motion';
import { MouseEvent, useMemo } from 'react';

export function BentoGrid({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
      className={cn(
        'grid grid-cols-1 gap-4 sm:gap-5 md:auto-rows-[minmax(100px,auto)] md:grid-cols-3 lg:grid-cols-4 xl:gap-6',
        className,
      )}>
      {children}
    </motion.div>
  );
}

export function BentoCard({
  className,
  children,
  colSpan = 1,
  rowSpan = 1,
  backgroundImage,
  backgroundOpacity = 0.2, // Subtle default
}: {
  className?: string;
  children: React.ReactNode;
  colSpan?: number;
  rowSpan?: number;
  backgroundImage?: string;
  backgroundOpacity?: number;
}) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Random breathing delay to make it feel organic (not robotic sync)
  const breatheDelay = useMemo(() => Math.random() * -10, []);

  const handleMouseMove = ({ currentTarget, clientX, clientY }: MouseEvent) => {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  return (
    <motion.div
      className={cn(
        'group relative min-w-0 overflow-hidden rounded-[1.75rem] glass-widget p-5 transition-all animate-[breathe-card_8s_ease-in-out_infinite] hover:bg-white/5 sm:rounded-[2rem] sm:p-6',
        colSpan === 2 && 'md:col-span-2',
        colSpan === 3 && 'md:col-span-3',
        colSpan === 4 && 'md:col-span-4', // Full width
        rowSpan === 2 && 'md:row-span-2',
        className,
      )}
      style={{ animationDelay: `${breatheDelay}s` }}
      onMouseMove={handleMouseMove}
      variants={{
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            type: 'spring',
            damping: 25,
            stiffness: 200,
          },
        },
      }}
      whileHover={{ y: -4, scale: 1.01 }}>
      {/* Optional Background Image */}
      {backgroundImage && (
        <div
          className="absolute inset-0 z-0 select-none pointer-events-none"
          style={{ opacity: backgroundOpacity }}>
          <Image
            src={backgroundImage}
            alt=""
            fill
            unoptimized
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
        </div>
      )}

      {/* Spotlight Effect */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100 z-20"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(255,255,255,0.1),
              transparent 80%
            )
          `,
        }}
      />

      {/* Content */}
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
}
