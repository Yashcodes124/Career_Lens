import React from "react";
import { Badge, Card } from "./Primitives";

/**
 * Deprecated: Replaced by standard <Card /> from Primitives.tsx.
 * Kept as a clean light-mode pass-through until page refactoring in Phases 4-6.
 */
export const SpotlightCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <Card className={className}>{children}</Card>
);

/**
 * Deprecated: GSAP/Lenis scroll-jacking removed per UI Design Policy.
 */
export const PageTransition: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <>{children}</>;

/**
 * Deprecated: Single light theme is enforced globally. Renders nothing.
 */
export const ThemeSwitcher: React.FC = () => null;

/**
 * Deprecated: Replaced by standard heading text.
 */
export const BlurText: React.FC<{
  text: string;
  className?: string;
}> = ({ text, className = "" }) => <span className={className}>{text}</span>;

/**
 * Clean tabular number display without motion jitter.
 */
export const CountUpNumber: React.FC<{
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}> = ({ value, prefix = "", suffix = "", className = "" }) => (
  <span className={`tabular-nums ${className}`}>
    {prefix}
    {value}
    {suffix}
  </span>
);

/**
 * Deprecated: Replaced by standard <Button /> from Primitives.tsx.
 */
export const MagneticButton: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div className={`inline-flex ${className}`}>{children}</div>
);

/**
 * Deprecated: Replaced by standard <Badge /> from Primitives.tsx.
 */
export const ShinyBadge: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <Badge tone="primary" className={className}>
    {children}
  </Badge>
);
