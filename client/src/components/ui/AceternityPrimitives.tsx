import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import gsap from "gsap";
import { Palette } from "lucide-react";

type ThemeMode = "obsidian" | "vengeance" | "arctic";
const THEMES: { id: ThemeMode; label: string; dot: string }[] = [
  { id: "obsidian", label: "Obsidian", dot: "bg-teal-400" },
  { id: "vengeance", label: "Vengeance", dot: "bg-violet-400" },
  { id: "arctic", label: "Arctic", dot: "bg-sky-400" },
];

/**
 * 1. Aceternity UI Mouse-Tracking Spotlight Card
 */
export const SpotlightCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0, opacity: 0 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!boxRef.current) return;
    const rect = boxRef.current.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      opacity: 1,
    });
  };

  return (
    <div
      ref={boxRef}
      data-gsap="card"
      onMouseMove={handleMove}
      onMouseLeave={() => setCoords((c) => ({ ...c, opacity: 0 }))}
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-subtle)",
      }}
      className={`relative overflow-hidden rounded-xl border backdrop-blur-md transition-colors duration-300 ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity: coords.opacity,
          background: `radial-gradient(480px circle at ${coords.x}px ${coords.y}px, var(--accent-glow), transparent 40%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

/**
 * 2. GSAP & Barba-Style Smooth Route & Stagger Wrapper
 */
export const PageTransition: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 12, filter: "blur(4px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.42,
          ease: "power3.out",
        },
      );

      const cards = el.querySelectorAll("[data-gsap='card'], section, article");
      if (cards.length > 0) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 14 },
          {
            opacity: 1,
            y: 0,
            duration: 0.45,
            stagger: 0.045,
            ease: "power2.out",
            clearProps: "transform",
          },
        );
      }
    }, el);

    return () => ctx.revert();
  }, [location.pathname]);

  return <div ref={containerRef}>{children}</div>;
};

/**
 * 3. Live Multi-Theme Switcher (Obsidian / Vengeance / Arctic)
 */
export const ThemeSwitcher: React.FC = () => {
  const [theme, setTheme] = useState<ThemeMode>(
    () => (localStorage.getItem("truehire_theme") as ThemeMode) || "obsidian",
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("truehire_theme", theme);
  }, [theme]);

  const cycleTheme = () => {
    const nextIdx =
      (THEMES.findIndex((t) => t.id === theme) + 1) % THEMES.length;
    setTheme(THEMES[nextIdx].id);
  };

  const active = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <button
      type="button"
      onClick={cycleTheme}
      title="Switch visual theme"
      className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/70 px-2.5 py-1 font-mono text-[11px] text-zinc-300 transition hover:border-zinc-700 hover:text-white"
    >
      <Palette className="h-3 w-3 text-zinc-400" />
      <span className={`h-2 w-2 rounded-full ${active.dot}`} />
      <span>{active.label}</span>
    </button>
  );
};
