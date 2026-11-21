import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  Briefcase,
  CheckCircle2,
  Code2,
  Database,
  FileText,
  Layers,
  MessageSquare,
  ShieldCheck,
  Target,
} from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { ContentContainer } from "../../components/layout";
import {
  Badge,
  Button,
  Card,
  EDITORIAL_EASE,
  FeedbackCard,
  ProgressBar,
  RequirementRow,
  ScoreRing,
  ScrollProgressBar,
  ScrollReveal,
  Skeleton,
  SkillBadge,
  StaggerGroup,
  StaggerItem,
  Tabs,
  ThemeToggle,
} from "../../components/ui";

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Upload your resume",
    description:
      "Upload a PDF or DOCX resume to extract your baseline technical skills and project experience.",
  },
  {
    step: "02",
    title: "Compare with real roles",
    description:
      "Check how your skills match verified company postings or paste any job description you want to evaluate.",
  },
  {
    step: "03",
    title: "Prioritize missing skills",
    description:
      "See which requirements you already meet and which gaps appear most often across your saved roles.",
  },
  {
    step: "04",
    title: "Practice and record evidence",
    description:
      "Complete a 15–60 minute targeted mock interview. Rubric scores update your skill profile automatically.",
  },
];

const CLOSED_LOOP_NODES = [
  {
    index: "01",
    stage: "Resume",
    summary: "Extract skills you can review and edit.",
  },
  {
    index: "02",
    stage: "Job Matching",
    summary: "Compare your skills against role requirements.",
  },
  {
    index: "03",
    stage: "Skill Gaps",
    summary: "Rank missing skills by role frequency.",
  },
  {
    index: "04",
    stage: "Interview",
    summary: "Answer questions focused on weak or missing skills.",
  },
  {
    index: "05",
    stage: "Evaluation",
    summary: "Score each answer against a clear rubric.",
  },
  {
    index: "06",
    stage: "Skill Profile",
    summary: "Carry verified evidence into your next job match.",
  },
];

const CORE_FEATURES = [
  {
    icon: <FileText className="h-4 w-4 text-primary" aria-hidden="true" />,
    title: "Editable resume skill extraction",
    description:
      "Parse PDF and DOCX resumes into structured skills that you can confirm, add to, or remove at any time.",
  },
  {
    icon: <Briefcase className="h-4 w-4 text-primary" aria-hidden="true" />,
    title: "Verified ATS postings",
    description:
      "Browse engineering roles synced directly from official Greenhouse job boards with source links and sync timestamps.",
  },
  {
    icon: <Target className="h-4 w-4 text-primary" aria-hidden="true" />,
    title: "Explainable requirement coverage",
    description:
      "Every match score shows the exact count of matched, weak, and missing requirements—never an unexplained percentage.",
  },
  {
    icon: <MessageSquare className="h-4 w-4 text-primary" aria-hidden="true" />,
    title: "Targeted mock interviews",
    description:
      "Run technical and behavioral sessions scoped to a specific job and the exact skills you need to prove.",
  },
  {
    icon: <Award className="h-4 w-4 text-primary" aria-hidden="true" />,
    title: "Evidence-backed skill profile",
    description:
      "Track which skills are only claimed on your resume versus practiced or verified through interview evaluations.",
  },
  {
    icon: <Layers className="h-4 w-4 text-primary" aria-hidden="true" />,
    title: "Application pipeline tracker",
    description:
      "Organize roles across Saved, Applied, Interviewing, Offer, and Rejected with match scores and gap notes attached.",
  },
];

export const LandingPage: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [previewTab, setPreviewTab] = useState<string>("match");

  const primaryDestination =
    isAuthenticated || user ? "/dashboard" : "/register";

  return (
    <div className="min-h-screen bg-canvas text-content-body theme-surface-transition">
      <ScrollProgressBar />

      {/* Sticky 3-Zone Top Navigation */}
      <header className="sticky top-0 z-30 h-16 border-b border-border bg-surface/90 backdrop-blur-md theme-surface-transition">
        <ContentContainer
          size="xl"
          padded={false}
          className="flex h-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8"
        >
          <div className="flex items-center gap-8 min-w-0">
            <Link
              to="/"
              className="flex shrink-0 items-center gap-2.5 rounded-sm font-display text-base font-bold tracking-tight text-content-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary font-mono text-xs font-bold text-primary-foreground shadow-xs">
                TH
              </span>
              <span>TrueHire</span>
            </Link>

            <nav
              aria-label="Marketing sections"
              className="hidden items-center gap-6 text-sm font-medium text-content-secondary md:flex"
            >
              <a
                href="#closed-loop"
                className="whitespace-nowrap transition-colors duration-150 hover:text-content-heading"
              >
                Closed-loop
              </a>
              <a
                href="#how-it-works"
                className="whitespace-nowrap transition-colors duration-150 hover:text-content-heading"
              >
                How it works
              </a>
              <a
                href="#features"
                className="whitespace-nowrap transition-colors duration-150 hover:text-content-heading"
              >
                Capabilities
              </a>
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
            <ThemeToggle variant="segmented" className="hidden lg:inline-flex" />
            <ThemeToggle variant="compact" className="lg:hidden" />

            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : isAuthenticated || user ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/jobs")}
                  className="hidden sm:inline-flex"
                >
                  Explore Jobs
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate("/dashboard")}
                  rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                >
                  Dashboard
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/login")}
                >
                  Sign in
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate("/register")}
                  rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                >
                  Get started
                </Button>
              </>
            )}
          </div>
        </ContentContainer>
      </header>

      <main>
        {/* Hero Section — Immediate First-Paint Visibility + Subtle Editorial Motion */}
        <section className="relative overflow-hidden border-b border-border bg-canvas py-12 sm:py-16 lg:py-20 theme-surface-transition">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-architectural-grid opacity-45 [mask-image:radial-gradient(ellipse_75%_65%_at_50%_15%,#000_25%,transparent_100%)]"
          />

          <ContentContainer
            size="xl"
            padded={false}
            className="relative z-10 px-4 sm:px-6 lg:px-8"
          >
            <div className="grid items-start gap-10 lg:grid-cols-12 lg:items-center lg:gap-12">
              {/* Left Column: Headline & Actions */}
              <motion.div
                initial={{ opacity: 0.96, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32, ease: EDITORIAL_EASE }}
                className="space-y-6 lg:col-span-5"
              >
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  Verified Job Discovery · Interview Readiness
                </p>

                <h1 className="font-display text-3xl font-bold tracking-tight text-content-heading sm:text-4xl lg:text-[3.05rem] lg:leading-[1.08]">
                  Know which requirements you meet before you apply.
                </h1>

                <p className="max-w-[56ch] text-base leading-relaxed text-content-body">
                  Upload your resume to inspect exact skill coverage on real
                  engineering roles, prioritize your highest-frequency gaps, and
                  practice targeted mock interviews that update your readiness
                  profile.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => navigate(primaryDestination)}
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    {isAuthenticated || user
                      ? "Go to Dashboard"
                      : "Start with your resume"}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => navigate("/jobs")}
                  >
                    Browse verified jobs
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-4 border-t border-border pt-6">
                  <div>
                    <p className="font-mono text-base font-semibold text-content-heading tabular-nums">
                      8 / 12
                    </p>
                    <p className="mt-1 text-xs leading-snug text-content-secondary">
                      Transparent requirement coverage
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-base font-semibold text-content-heading tabular-nums">
                      15–60m
                    </p>
                    <p className="mt-1 text-xs leading-snug text-content-secondary">
                      Skill-scoped mock interviews
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-base font-semibold text-content-heading tabular-nums">
                      Direct ATS
                    </p>
                    <p className="mt-1 text-xs leading-snug text-content-secondary">
                      Synced from company boards
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Right Column: Interactive Product Preview */}
              <motion.div
                initial={{ opacity: 0.96, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.06, ease: EDITORIAL_EASE }}
                className="lg:col-span-7"
              >
                <Card
                  padding="none"
                  className="overflow-hidden border-border-strong/70 shadow-elevated"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/70 px-4 py-3 sm:px-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-xs font-semibold text-content-heading">
                        Live Workspace Preview
                      </span>
                      <span className="font-mono text-[11px] text-content-secondary">
                        Backend Engineer · Sample Role
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-primary">
                      Interactive stages
                    </span>
                  </div>

                  <div className="p-4 sm:p-6">
                    <Tabs
                      activeTab={previewTab}
                      onChange={setPreviewTab}
                      items={[
                        {
                          id: "match",
                          label: "1. Role Match",
                          content: (
                            <div className="space-y-4">
                              <Card
                                muted
                                padding="sm"
                                className="flex flex-wrap items-center justify-between gap-4"
                              >
                                <div className="space-y-1">
                                  <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-content-secondary">
                                    Requirement Coverage
                                  </p>
                                  <p className="text-base font-semibold text-content-heading">
                                    You meet 8 of 12 requirements for this role.
                                  </p>
                                  <p className="text-xs text-content-secondary">
                                    6 skills verified in interviews · 2 skills
                                    on resume · 4 gaps identified
                                  </p>
                                </div>
                                <ScoreRing score={67} size={68} label="Match" />
                              </Card>

                              <div className="space-y-2.5">
                                <RequirementRow
                                  skill="PostgreSQL"
                                  status="MET"
                                  evidence="Verified in technical mock interview (86/100)"
                                />
                                <RequirementRow
                                  skill="TypeScript & Node.js"
                                  status="PRACTICED"
                                  evidence="Matched on resume + practiced in 1 session"
                                />
                                <RequirementRow
                                  skill="API Authentication"
                                  status="MISSING"
                                  priority="high"
                                  frequencyLabel="Appears in 7 saved jobs"
                                />
                              </div>
                            </div>
                          ),
                        },
                        {
                          id: "gaps",
                          label: "2. Skill Gaps",
                          content: (
                            <div className="space-y-3">
                              <Card muted padding="sm">
                                <p className="text-xs font-semibold text-content-heading">
                                  Your strongest gap is API authentication. It
                                  appears in 7 of your saved jobs.
                                </p>
                                <p className="mt-1 text-xs text-content-secondary">
                                  Gaps are ranked by how frequently they appear
                                  across your target roles.
                                </p>
                              </Card>
                              <RequirementRow
                                skill="API Authentication (OAuth2 / JWT)"
                                status="MISSING"
                                priority="high"
                                evidence="Required in 7 of 9 saved backend roles"
                              />
                              <RequirementRow
                                skill="Redis Distributed Caching"
                                status="WEAK"
                                priority="high"
                                evidence="Scored 48/100 in last interview — needs practice"
                              />
                              <RequirementRow
                                skill="Rate Limiting & Backpressure"
                                status="MISSING"
                                priority="medium"
                                evidence="Required in 4 of 9 saved backend roles"
                              />
                            </div>
                          ),
                        },
                        {
                          id: "interview",
                          label: "3. Evaluation",
                          content: (
                            <FeedbackCard
                              title="Question 2 Evaluation · API Authentication"
                              score={84}
                              summary="Clear explanation of short-lived access tokens paired with rotating refresh tokens and revocation lists."
                              strengths={[
                                "Explained token rotation and replay detection clearly.",
                                "Addressed stateless vs. stateful revocation trade-offs.",
                              ]}
                              improvements={[
                                "Specify cookie security flags (HttpOnly, SameSite, Secure) when storing refresh tokens.",
                              ]}
                            />
                          ),
                        },
                        {
                          id: "profile",
                          label: "4. Skill Profile",
                          content: (
                            <div className="space-y-4">
                              <Card muted padding="sm">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div>
                                    <p className="text-sm font-semibold text-content-heading">
                                      Your readiness improved by 6 points after
                                      your last interview.
                                    </p>
                                    <p className="text-xs text-content-secondary">
                                      API Authentication moved from Missing to
                                      Practiced.
                                    </p>
                                  </div>
                                  <Badge tone="success">+6 pts</Badge>
                                </div>
                              </Card>

                              <div className="space-y-3">
                                <ProgressBar
                                  label="Backend APIs & Auth"
                                  value={84}
                                  tone="success"
                                />
                                <ProgressBar
                                  label="Relational Databases"
                                  value={78}
                                  tone="primary"
                                />
                                <ProgressBar
                                  label="Distributed Caching"
                                  value={52}
                                  tone="warning"
                                />
                              </div>

                              <div className="flex flex-wrap gap-2 pt-1">
                                <SkillBadge
                                  skill="PostgreSQL"
                                  level="VERIFIED"
                                />
                                <SkillBadge
                                  skill="API Authentication"
                                  level="PRACTICED"
                                />
                                <SkillBadge
                                  skill="TypeScript"
                                  level="VERIFIED"
                                />
                                <SkillBadge
                                  skill="Redis Caching"
                                  level="WEAK"
                                />
                              </div>
                            </div>
                          ),
                        },
                      ]}
                    />
                  </div>
                </Card>
              </motion.div>
            </div>
          </ContentContainer>
        </section>

        {/* Closed-Loop Workflow Strip */}
        <section
          id="closed-loop"
          className="border-b border-border bg-surface py-14 sm:py-20 theme-surface-transition"
        >
          <ContentContainer
            size="xl"
            padded={false}
            className="px-4 sm:px-6 lg:px-8"
          >
            <ScrollReveal className="max-w-2xl space-y-2.5">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Closed-Loop System
              </p>
              <h2 className="font-display text-2xl font-bold tracking-tight text-content-heading sm:text-3xl">
                Every interview updates your skill profile.
              </h2>
              <p className="text-sm leading-relaxed text-content-secondary sm:text-base">
                Most job tools stop at a static resume keyword score. TrueHire
                connects your resume, role requirements, and interview feedback
                into one continuous evidence loop.
              </p>
            </ScrollReveal>

            <StaggerGroup className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
              {CLOSED_LOOP_NODES.map((node) => (
                <StaggerItem key={node.stage} className="h-full">
                  <Card
                    padding="sm"
                    interactive
                    className="flex h-full flex-col justify-between"
                  >
                    <div>
                      <span className="font-mono text-[11px] font-semibold text-primary tabular-nums">
                        {node.index}
                      </span>
                      <p className="mt-1 font-display text-sm font-semibold text-content-heading">
                        {node.stage}
                      </p>
                      <p className="mt-1.5 text-xs leading-relaxed text-content-secondary">
                        {node.summary}
                      </p>
                    </div>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </ContentContainer>
        </section>

        {/* How It Works (4 Concrete Steps) */}
        <section
          id="how-it-works"
          className="border-b border-border bg-canvas py-14 sm:py-20 theme-surface-transition"
        >
          <ContentContainer
            size="xl"
            padded={false}
            className="px-4 sm:px-6 lg:px-8"
          >
            <ScrollReveal className="max-w-2xl space-y-2.5">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                How It Works
              </p>
              <h2 className="font-display text-2xl font-bold tracking-tight text-content-heading sm:text-3xl">
                Four steps from resume upload to verified readiness.
              </h2>
            </ScrollReveal>

            <StaggerGroup className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {WORKFLOW_STEPS.map((item) => (
                <StaggerItem key={item.step} className="h-full">
                  <Card padding="md" interactive className="h-full">
                    <span className="inline-flex items-center font-mono text-xs font-semibold text-primary tabular-nums">
                      STEP {item.step}
                    </span>
                    <h3 className="mt-3 font-display text-base font-semibold text-content-heading">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-content-secondary">
                      {item.description}
                    </p>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </ContentContainer>
        </section>

        {/* Core Product Capabilities */}
        <section
          id="features"
          className="border-b border-border bg-surface py-14 sm:py-20 theme-surface-transition"
        >
          <ContentContainer
            size="xl"
            padded={false}
            className="px-4 sm:px-6 lg:px-8"
          >
            <ScrollReveal className="max-w-2xl space-y-2.5">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Core Capabilities
              </p>
              <h2 className="font-display text-2xl font-bold tracking-tight text-content-heading sm:text-3xl">
                Built for practical engineering preparation.
              </h2>
              <p className="text-sm leading-relaxed text-content-secondary sm:text-base">
                Transparent matching, source-verified job postings, and
                non-fabricated resume tailoring.
              </p>
            </ScrollReveal>

            <StaggerGroup className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {CORE_FEATURES.map((feat) => (
                <StaggerItem key={feat.title} className="h-full">
                  <Card padding="md" interactive className="group h-full">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-input border border-border bg-muted transition-colors duration-150 group-hover:border-primary/40 group-hover:bg-primary-soft">
                      {feat.icon}
                    </div>
                    <h3 className="mt-4 font-display text-base font-semibold text-content-heading">
                      {feat.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-content-secondary">
                      {feat.description}
                    </p>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerGroup>

            {/* Technical Credibility & Provenance Row */}
            <StaggerGroup className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StaggerItem>
                <Card muted padding="sm" className="flex h-full items-start gap-3">
                  <ShieldCheck
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-xs font-semibold text-content-heading">
                      Non-Fabricated Tailoring
                    </p>
                    <p className="mt-0.5 text-xs text-content-secondary">
                      Rewrites are strictly bounded by your existing resume facts.
                    </p>
                  </div>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card muted padding="sm" className="flex h-full items-start gap-3">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-status-success"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-xs font-semibold text-content-heading">
                      Traceable Scores
                    </p>
                    <p className="mt-0.5 text-xs text-content-secondary">
                      Every score lists the exact skills matched and missing.
                    </p>
                  </div>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card muted padding="sm" className="flex h-full items-start gap-3">
                  <Database
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-xs font-semibold text-content-heading">
                      Resumable Sessions
                    </p>
                    <p className="mt-0.5 text-xs text-content-secondary">
                      Pause and resume mock interviews without losing answers.
                    </p>
                  </div>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card muted padding="sm" className="flex h-full items-start gap-3">
                  <Code2
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-xs font-semibold text-content-heading">
                      Official ATS Sources
                    </p>
                    <p className="mt-0.5 text-xs text-content-secondary">
                      Direct company board links and sync timestamps on every job.
                    </p>
                  </div>
                </Card>
              </StaggerItem>
            </StaggerGroup>
          </ContentContainer>
        </section>

        {/* Single Final CTA */}
        <section className="bg-canvas py-14 sm:py-20 theme-surface-transition">
          <ContentContainer
            size="md"
            padded={false}
            className="px-4 sm:px-6 lg:px-8"
          >
            <ScrollReveal>
              <Card
                padding="lg"
                className="border-border-strong/80 text-center shadow-elevated"
              >
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  Ready When You Are
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-content-heading sm:text-3xl">
                  See where you stand on your target roles.
                </h2>
                <p className="mx-auto mt-2.5 max-w-xl text-sm leading-relaxed text-content-secondary">
                  Upload your resume to inspect your requirement coverage on real
                  engineering jobs and practice targeted interviews.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => navigate(primaryDestination)}
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    {isAuthenticated || user
                      ? "Open Dashboard"
                      : "Create your account"}
                  </Button>
                </div>
              </Card>
            </ScrollReveal>
          </ContentContainer>
        </section>
      </main>

      <footer className="border-t border-border bg-canvas py-8 theme-surface-transition">
        <ContentContainer
          size="xl"
          padded={false}
          className="flex flex-wrap items-center justify-between gap-4 px-4 text-xs text-content-secondary sm:px-6 lg:px-8"
        >
          <span className="font-medium text-content-body">
            TrueHire · Job Discovery & Interview Readiness
          </span>
          <div className="flex flex-wrap items-center gap-5">
            <ThemeToggle variant="segmented" />
            <Link
              to="/jobs"
              className="transition-colors hover:text-content-heading"
            >
              Explore Jobs
            </Link>
            <Link
              to="/login"
              className="transition-colors hover:text-content-heading"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="transition-colors hover:text-content-heading"
            >
              Create account
            </Link>
          </div>
        </ContentContainer>
      </footer>
    </div>
  );
};

export default LandingPage;
