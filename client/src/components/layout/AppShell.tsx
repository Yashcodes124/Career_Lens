import React, { createContext, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CommandPalette } from "./CommandPalette";
import { ContentContainer } from "./ContentContainer";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { ThemeToggle } from "../ui";

const AppShellContext = createContext<boolean>(false);

export const useAppShell = (): boolean => useContext(AppShellContext);

export interface AppShellProps {
  variant?: "workspace" | "auth" | "minimal";
  containerSize?: "sm" | "md" | "lg" | "xl" | "full";
  padded?: boolean;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  variant = "workspace",
  containerSize = "xl",
  padded = false,
  children,
}) => {
  const isAlreadyInsideShell = useAppShell();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    if (isAlreadyInsideShell || variant !== "workspace") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isAlreadyInsideShell, variant]);

  // Prevent double-wrapping if a page in Phases 4–6 also wraps itself in <AppShell>
  if (isAlreadyInsideShell) {
    return <>{children}</>;
  }

  if (variant === "auth" || variant === "minimal") {
    return (
      <AppShellContext.Provider value={true}>
        <div className="flex min-h-screen flex-col bg-canvas text-content-body">
          <header className="h-16 border-b border-border bg-surface">
            <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
              <Link
                to="/"
                className="flex items-center gap-2.5 text-base font-semibold tracking-tight text-content-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary text-xs font-bold text-white">
                  TH
                </span>
                <span>TrueHire</span>
              </Link>
              <div className="flex items-center gap-3">
                <ThemeToggle variant="segmented" className="hidden sm:inline-flex" />
                <ThemeToggle variant="compact" className="sm:hidden" />
                {variant === "auth" && (
                  <Link
                    to="/"
                    className="whitespace-nowrap rounded-sm px-2 py-1 text-xs font-medium text-content-secondary transition-colors hover:text-content-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Back to home
                  </Link>
                )}
              </div>
            </div>
          </header>

          <main
            id="main-content"
            className="flex flex-1 items-center justify-center p-4 sm:p-6"
          >
            {children}
          </main>
        </div>
      </AppShellContext.Provider>
    );
  }

  return (
    <AppShellContext.Provider value={true}>
      <div className="min-h-screen bg-canvas text-content-body">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-input focus:bg-primary focus:px-4 focus:py-2 focus:text-xs focus:font-semibold focus:text-white"
        >
          Skip to main content
        </a>

        {/* Persistent Desktop Left Sidebar (>=1024px) */}
        <Sidebar />

        {/* Mobile & Tablet Navigation Drawer (<1024px) */}
        <MobileNav
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />

        {/* Main Content Column */}
        <div className="flex min-h-screen flex-col lg:pl-64">
          <TopNav
            onOpenMobileNav={() => setMobileNavOpen(true)}
            onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          />

          <main id="main-content" className="flex-1">
            {padded ? (
              <ContentContainer size={containerSize}>
                {children}
              </ContentContainer>
            ) : (
              children
            )}
          </main>
        </div>

        <CommandPalette
          open={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
        />
      </div>
    </AppShellContext.Provider>
  );
};
