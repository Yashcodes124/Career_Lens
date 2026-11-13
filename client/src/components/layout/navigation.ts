import React from "react";
import {
  Award,
  Bookmark,
  Briefcase,
  FileText,
  Kanban,
  LayoutDashboard,
  MessageSquare,
  User,
} from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  group: "workspace" | "pipeline" | "account";
  icon: React.ComponentType<{ className?: string }>;
  matchPrefixes: string[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    group: "workspace",
    icon: LayoutDashboard,
    matchPrefixes: ["/dashboard"],
  },
  {
    label: "Readiness",
    path: "/readiness",
    group: "workspace",
    icon: Award,
    matchPrefixes: ["/readiness", "/skills", "/skill-gaps"],
  },
  {
    label: "Interviews",
    path: "/interviews",
    group: "workspace",
    icon: MessageSquare,
    matchPrefixes: ["/interviews"],
  },
  {
    label: "Resumes",
    path: "/resume",
    group: "workspace",
    icon: FileText,
    matchPrefixes: ["/resume", "/tailor"],
  },
  {
    label: "Explore Jobs",
    path: "/jobs",
    group: "pipeline",
    icon: Briefcase,
    matchPrefixes: ["/jobs", "/matches"],
  },
  {
    label: "Saved Jobs",
    path: "/saved-jobs",
    group: "pipeline",
    icon: Bookmark,
    matchPrefixes: ["/saved-jobs"],
  },
  {
    label: "Applications",
    path: "/applications",
    group: "pipeline",
    icon: Kanban,
    matchPrefixes: ["/applications"],
  },
  {
    label: "Profile",
    path: "/profile",
    group: "account",
    icon: User,
    matchPrefixes: ["/profile", "/profile-setup"],
  },
];

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  return item.matchPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function getRouteContext(pathname: string): {
  section: string;
  title: string;
  parentPath?: string;
} {
  if (pathname === "/dashboard") {
    return { section: "Workspace", title: "Dashboard" };
  }
  if (pathname === "/readiness" || pathname === "/skills") {
    return { section: "Workspace", title: "Skill Readiness" };
  }
  if (pathname.startsWith("/skill-gaps/")) {
    return {
      section: "Readiness",
      title: "Skill Gap Analysis",
      parentPath: "/readiness",
    };
  }
  if (pathname === "/interviews") {
    return { section: "Workspace", title: "Mock Interviews" };
  }
  if (pathname.endsWith("/prep") && pathname.startsWith("/interviews/")) {
    return {
      section: "Interviews",
      title: "Interview Preparation",
      parentPath: "/interviews",
    };
  }
  if (pathname.endsWith("/live") && pathname.startsWith("/interviews/")) {
    return {
      section: "Interviews",
      title: "Live Interview Session",
      parentPath: "/interviews",
    };
  }
  if (pathname.endsWith("/evaluation") && pathname.startsWith("/interviews/")) {
    return {
      section: "Interviews",
      title: "Interview Evaluation",
      parentPath: "/interviews",
    };
  }
  if (pathname === "/resume") {
    return { section: "Workspace", title: "Resume Intelligence" };
  }
  if (pathname.startsWith("/tailor/")) {
    return {
      section: "Resumes",
      title: "Evidence-Bounded Tailoring",
      parentPath: "/resume",
    };
  }
  if (pathname === "/jobs") {
    return { section: "Pipeline", title: "Verified Jobs" };
  }
  if (pathname.startsWith("/matches/")) {
    return {
      section: "Explore Jobs",
      title: "Role Match Breakdown",
      parentPath: "/jobs",
    };
  }
  if (pathname === "/saved-jobs") {
    return { section: "Pipeline", title: "Saved Jobs" };
  }
  if (pathname === "/applications") {
    return { section: "Pipeline", title: "Application Tracker" };
  }
  if (pathname === "/profile") {
    return { section: "Account", title: "Candidate Profile" };
  }
  if (pathname === "/profile-setup") {
    return {
      section: "Profile",
      title: "Edit Profile Preferences",
      parentPath: "/profile",
    };
  }
  if (pathname === "/onboarding") {
    return { section: "Setup", title: "Candidate Onboarding" };
  }
  return { section: "Workspace", title: "TrueHire" };
}
