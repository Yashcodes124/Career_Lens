import React, { createContext, useContext, useState } from "react";
import { Link } from "react-router-dom";
import { ContentContainer } from "./ContentContainer";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";

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
              {variant === "auth" && (
                <Link
                  to="/"
                  className="text-xs font-medium text-content-secondary hover:text-content-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm px-2 py-1"
                >
                  Back to home
                </Link>
              )}
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
          <TopNav onOpenMobileNav={() => setMobileNavOpen(true)} />

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
      </div>
    </AppShellContext.Provider>
  );
};
