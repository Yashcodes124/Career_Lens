import React, { useState } from "react";
import { useAppShell, TopNav, MobileNav } from "./layout";

export const Navbar: React.FC = () => {
  const isInsideShell = useAppShell();
  const [mobileOpen, setMobileOpen] = useState(false);

  // When wrapped in AppShell, the shell already renders Sidebar + TopNav + MobileNav
  if (isInsideShell) {
    return null;
  }

  return (
    <>
      <TopNav
        onOpenMobileNav={() => setMobileOpen(true)}
        showHorizontalLinks={true}
      />
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
};

export default Navbar;
