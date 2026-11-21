import React from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  type HTMLMotionProps,
} from "framer-motion";

export const EDITORIAL_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Smooth compositor-only page entrance wrapper for route views.
 */
export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className = "",
}) => {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: EDITORIAL_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export interface ScrollRevealProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}

/**
 * Scroll-triggered entrance animation using compositor-only transform & opacity.
 * Always triggers once and uses a forgiving viewport threshold so sections never stay hidden.
 */
export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  delay = 0,
  y = 18,
  className = "",
  ...rest
}) => {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.42, delay, ease: EDITORIAL_EASE }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

export interface StaggerGroupProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export const StaggerGroup: React.FC<StaggerGroupProps> = ({
  children,
  className = "",
  staggerDelay = 0.055,
}) => {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

export const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  className = "",
}) => {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 14 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.36, ease: EDITORIAL_EASE },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export interface HoverLiftProps {
  children: React.ReactNode;
  className?: string;
  lift?: number;
}

/**
 * Tactile micro-interaction lift on pointer hover (<= 180ms, compositor-only).
 */
export const HoverLift: React.FC<HoverLiftProps> = ({
  children,
  className = "",
  lift = -3,
}) => {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      whileHover={{ y: lift }}
      transition={{ duration: 0.18, ease: EDITORIAL_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Subtle 2px reading progress bar fixed at the top of long-form pages.
 */
export const ScrollProgressBar: React.FC = () => {
  const prefersReduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 240,
    damping: 32,
    restDelta: 0.001,
  });

  if (prefersReduced) return null;

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[2px] origin-left bg-primary"
    />
  );
};
