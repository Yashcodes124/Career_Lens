import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useInView,
  useScroll,
} from "framer-motion";
import { Palette, Sparkles, ShieldCheck, ArrowUpRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export type ThemeMode = "daylight" | "obsidian" | "vengeance";

const THEMES: { id: ThemeMode; label: string; dot: string }[] = [
  { id: "daylight", label: "Daylight", dot: "bg-blue-600" },
  { id: "obsidian", label: "Obsidian", dot: "bg-teal-400" },
  { id: "vengeance", label: "Vengeance", dot: "bg-violet-500" },
];

/**
 * 1. 21st.dev + Aceternity UI 3D Tilt & Radial Cursor Spotlight Card
 * Separates outer GSAP reveal wrapper from inner Framer Motion tilt layer so transforms never clash.
 */
export const SpotlightCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  enableTilt?: boolean;
  revealFrom?: "left" | "right" | "bottom-right" | "bottom";
}> = ({
  children,
  className = "",
  enableTilt = true,
  revealFrom = "bottom",
}) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0, opacity: 0 });
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!boxRef.current) return;
    const rect = boxRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCoords({ x, y, opacity: 1 });

    if (enableTilt) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      setTilt({
        rotateX: ((y - centerY) / centerY) * -2.5,
        rotateY: ((x - centerX) / centerX) * 2.5,
      });
    }
  };

  const handleLeave = () => {
    setCoords((c) => ({ ...c, opacity: 0 }));
    setTilt({ rotateX: 0, rotateY: 0 });
  };

  return (
    <div data-gsap="card" data-reveal={revealFrom} className="h-full">
      <motion.div
        ref={boxRef}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        animate={{
          rotateX: tilt.rotateX,
          rotateY: tilt.rotateY,
        }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        style={{ transformPerspective: 1000 }}
        className={`interactive-card group relative h-full overflow-hidden rounded-xl border border-slate-200 bg-white ${className}`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-px rounded-xl transition-opacity duration-300"
          style={{
            opacity: coords.opacity,
            background: `radial-gradient(480px circle at ${coords.x}px ${coords.y}px, var(--accent-glow), transparent 45%)`,
          }}
        />
        <div className="relative z-10">{children}</div>
      </motion.div>
    </div>
  );
};

/**
 * 2. React Bits — BlurText Word-by-Word Spring Reveal
 */
export const BlurText: React.FC<{
  text: string;
  className?: string;
  delayStep?: number;
}> = ({ text, className = "", delayStep = 0.045 }) => {
  const words = text.split(" ");
  return (
    <span className={`inline-flex flex-wrap gap-x-[0.28em] ${className}`}>
      {words.map((word, idx) => (
        <motion.span
          key={`${word}-${idx}`}
          initial={{ opacity: 0, filter: "blur(10px)", y: 14 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{
            duration: 0.55,
            delay: idx * delayStep,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="inline-block"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
};

/**
 * 3. React Bits — Physics Spring CountUp Number Ticker
 */
export const CountUpNumber: React.FC<{
  value: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}> = ({ value, suffix = "", prefix = "", className = "" }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20px" });
  const motionVal = useMotionValue(0);
  const springVal = useSpring(motionVal, { stiffness: 90, damping: 20 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (isInView) {
      motionVal.set(value);
    }
  }, [isInView, value, motionVal]);

  useEffect(() => {
    return springVal.on("change", (latest) => {
      setDisplay(Math.round(latest));
    });
  }, [springVal]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
};

/**
 * 4. 21st.dev — Magnetic Hover Button Wrapper
 */
export const MagneticButton: React.FC<{
  children: React.ReactNode;
  className?: string;
  strength?: number;
}> = ({ children, className = "", strength = 0.22 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - (rect.left + rect.width / 2)) * strength;
    const y = (e.clientY - (rect.top + rect.height / 2)) * strength;
    setPos({ x, y });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={() => setPos({ x: 0, y: 0 })}
      animate={{ x: pos.x, y: pos.y }}
      transition={{ type: "spring", stiffness: 220, damping: 16, mass: 0.5 }}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.div>
  );
};

/**
 * 5. 21st.dev — Shiny Animated Border-Beam Badge
 */
export const ShinyBadge: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div
    className={`group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-blue-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-blue-700 shadow-2xs transition hover:border-blue-400 ${className}`}
  >
    <span className="shimmer-sweep pointer-events-none absolute inset-0" />
    <Sparkles className="h-3.5 w-3.5 text-blue-600 transition-transform duration-300 group-hover:rotate-12" />
    <span className="relative z-10">{children}</span>
  </div>
);

/**
 * 6. Shared Senior-Crafted Architectural Footer (Renders across pages)
 */
export const AppFooter: React.FC = () => (
  <footer className="mt-16 border-t border-slate-200 bg-white py-12">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-12">
        {/* Brand & Status */}
        <div className="space-y-3 lg:col-span-5">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 text-base font-semibold tracking-tight text-slate-900"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
              TH
            </span>
            <span>TrueHire</span>
          </Link>
          <p className="max-w-sm text-xs leading-relaxed text-slate-600">
            Evidence-based engineering interview readiness. Deterministic
            requirement coverage, targeted gap interviews, and verified skill
            profiles.
          </p>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>All Systems Operational · ATS & Rubric Engine Active</span>
          </div>
        </div>

        {/* Navigation Columns */}
        <div className="space-y-2.5 lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-900">
            Workspace
          </p>
          <ul className="space-y-2 text-xs text-slate-600">
            <li>
              <Link to="/dashboard" className="hover:text-blue-600">
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/readiness" className="hover:text-blue-600">
                Skill Readiness
              </Link>
            </li>
            <li>
              <Link to="/interviews" className="hover:text-blue-600">
                Interview Hub
              </Link>
            </li>
            <li>
              <Link to="/resume" className="hover:text-blue-600">
                Resume Intelligence
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-2.5 lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-900">
            Discovery
          </p>
          <ul className="space-y-2 text-xs text-slate-600">
            <li>
              <Link to="/jobs" className="hover:text-blue-600">
                Verified Jobs
              </Link>
            </li>
            <li>
              <Link to="/saved-jobs" className="hover:text-blue-600">
                Saved Roles
              </Link>
            </li>
            <li>
              <Link to="/applications" className="hover:text-blue-600">
                Application Pipeline
              </Link>
            </li>
            <li>
              <Link to="/profile" className="hover:text-blue-600">
                Candidate Profile
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3 lg:col-span-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-900">
            Appearance & Architecture
          </p>
          <p className="text-xs text-slate-600">
            Switch workspace theme anytime between Daylight, Obsidian, and
            Vengeance:
          </p>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <Link
              to="/jobs"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-blue-600"
            >
              <span>Explore Roles</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          <span>
            TrueHire Engineering Readiness Platform · Zero-Fabrication
            Guardrails
          </span>
        </div>
        <span className="font-mono text-[11px]">
          TypeScript · React · PostgreSQL · Prisma
        </span>
      </div>
    </div>
  </footer>
);

/**
 * 7. Directional GSAP ScrollTrigger + Lenis Smooth Scroll + Top Scroll Bar
 */
export const PageTransition: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    restDelta: 0.001,
  });

  // Initialize saved theme immediately so refreshes never flash unstyled
  useEffect(() => {
    const saved =
      (localStorage.getItem("truehire_theme") as ThemeMode) || "daylight";
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  // Initialize Lenis smooth scroll physics synced with GSAP ScrollTrigger
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const rafCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(rafCallback);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(rafCallback);
      lenis.destroy();
    };
  }, []);

  // Directional Scroll Choreography Engine (Left, Bottom-Right, Alternating Stagger)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });

    const animateUnseenElements = () => {
      // 1. Directional Split Columns (Left column comes from Left, Right column comes from Bottom-Right)
      const splitGrids = el.querySelectorAll<HTMLElement>(
        ".lg\\:grid-cols-12:not([data-split-done]), .lg\\:grid-cols-3:not([data-split-done]), .md\\:grid-cols-2:not([data-split-done])",
      );

      splitGrids.forEach((grid) => {
        grid.setAttribute("data-split-done", "true");
        const childrenCols = Array.from(grid.children) as HTMLElement[];
        childrenCols.forEach((col, idx) => {
          if (col.hasAttribute("data-gsap-done")) return;
          col.setAttribute("data-gsap-done", "true");

          const isLeft = idx === 0;
          gsap.fromTo(
            col,
            {
              opacity: 0,
              x: isLeft ? -52 : 52,
              y: isLeft ? 16 : 44,
              scale: 0.97,
            },
            {
              opacity: 1,
              x: 0,
              y: 0,
              scale: 1,
              duration: 0.72,
              delay: idx * 0.08,
              ease: "power3.out",
              clearProps: "transform,scale",
              scrollTrigger: {
                trigger: grid,
                start: "top 88%",
                toggleActions: "play none none none",
              },
            },
          );
        });
      });

      // 2. Cards, Sections, Articles & Explicit [data-reveal] Nodes
      const targets = el.querySelectorAll<HTMLElement>(
        "[data-reveal]:not([data-gsap-done]), [data-gsap='card']:not([data-gsap-done]), article:not([data-gsap-done]), .interactive-card:not([data-gsap-done]), section:not([data-gsap-done])",
      );

      targets.forEach((node, index) => {
        node.setAttribute("data-gsap-done", "true");
        const revealMode = node.getAttribute("data-reveal");

        // Alternate left / bottom-right / bottom vectors so cards feel dynamically choreographed
        let fromX = 0;
        let fromY = 34;

        if (revealMode === "left") {
          fromX = -56;
          fromY = 12;
        } else if (revealMode === "bottom-right" || revealMode === "right") {
          fromX = 56;
          fromY = 42;
        } else if (node.tagName !== "SECTION") {
          // Alternating directional entrance for cards
          fromX = index % 2 === 0 ? -28 : 28;
          fromY = 32;
        }

        gsap.fromTo(
          node,
          {
            opacity: 0,
            x: fromX,
            y: fromY,
            scale: 0.97,
          },
          {
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
            duration: 0.65,
            delay: Math.min((index % 5) * 0.06, 0.24),
            ease: "power3.out",
            clearProps: "transform,scale",
            scrollTrigger: {
              trigger: node,
              start: "top 91%",
              toggleActions: "play none none none",
            },
          },
        );
      });

      ScrollTrigger.refresh();
    };

    const timer = window.setTimeout(animateUnseenElements, 40);

    const observer = new MutationObserver(() => {
      animateUnseenElements();
    });

    observer.observe(el, { childList: true, subtree: true });

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [location.pathname]);

  const hideGlobalFooter =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname.includes("/live");

  return (
    <>
      {/* Top Smooth Scroll Progress Bar */}
      <motion.div
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 z-50 h-[2.5px] origin-left bg-gradient-to-r from-blue-600 via-teal-400 to-violet-500"
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          ref={containerRef}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="flex min-h-screen flex-col justify-between bg-[#f8fafc]"
        >
          <div className="flex-1">{children}</div>
          {!hideGlobalFooter && <AppFooter />}
        </motion.div>
      </AnimatePresence>
    </>
  );
};

/**
 * 8. Multi-Theme Switcher (Daylight / Obsidian / Vengeance)
 */
export const ThemeSwitcher: React.FC = () => {
  const [theme, setTheme] = useState<ThemeMode>(
    () => (localStorage.getItem("truehire_theme") as ThemeMode) || "daylight",
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
      title="Switch visual theme (Daylight / Obsidian / Vengeance)"
      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition hover:border-blue-400 hover:text-slate-900"
    >
      <Palette className="h-3.5 w-3.5 text-blue-600" />
      <span className={`h-2 w-2 rounded-full ${active.dot}`} />
      <span>{active.label}</span>
    </button>
  );
};
