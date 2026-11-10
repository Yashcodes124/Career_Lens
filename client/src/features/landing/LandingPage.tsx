import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  FeedbackCard,
  ProgressBar,
  RequirementRow,
  ScoreRing,
  Skeleton,
  SkillBadge,
  Tabs,
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
    stage: "1. Resume",
    summary: "Extract skills you can review and edit.",
  },
  {
    stage: "2. Job Matching",
    summary: "Compare your skills against role requirements.",
  },
  {
    stage: "3. Skill Gaps",
    summary: "Rank missing skills by role frequency.",
  },
  {
    stage: "4. Interview",
    summary: "Answer questions focused on weak or missing skills.",
  },
  {
    stage: "5. Evaluation",
    summary: "Score each answer against a clear rubric.",
  },
  {
    stage: "6. Skill Profile",
    summary: "Carry verified evidence into your next job match.",
  },
];

const CORE_FEATURES = [
  {
    icon: <FileText className="h-4 w-4 text-primary" />,
    title: "Editable resume skill extraction",
    description:
      "Parse PDF and DOCX resumes into structured skills that you can confirm, add to, or remove at any time.",
  },
  {
    icon: <Briefcase className="h-4 w-4 text-primary" />,
    title: "Verified ATS postings",
    description:
      "Browse engineering roles synced directly from official Greenhouse job boards with source links and sync timestamps.",
  },
  {
    icon: <Target className="h-4 w-4 text-primary" />,
    title: "Explainable requirement coverage",
    description:
      "Every match score shows the exact count of matched, weak, and missing requirements—never an unexplained percentage.",
  },
  {
    icon: <MessageSquare className="h-4 w-4 text-primary" />,
    title: "Targeted mock interviews",
    description:
      "Run technical and behavioral sessions scoped to a specific job and the exact skills you need to prove.",
  },
  {
    icon: <Award className="h-4 w-4 text-primary" />,
    title: "Evidence-backed skill profile",
    description:
      "Track which skills are only claimed on your resume versus practiced or verified through interview evaluations.",
  },
  {
    icon: <Layers className="h-4 w-4 text-primary" />,
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
    <div className="min-h-screen bg-canvas text-content-body">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 h-16 border-b border-border bg-surface">
        <ContentContainer
          size="xl"
          padded={false}
          className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8"
        >
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="flex items-center gap-2.5 rounded-sm text-base font-semibold tracking-tight text-content-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary text-xs font-bold text-white">
                TH
              </span>
              <span>TrueHire</span>
            </Link>

            <nav
              aria-label="Marketing sections"
              className="hidden items-center gap-6 text-sm font-medium text-content-secondary md:flex"
            >
              <a
                href="#how-it-works"
                className="transition-colors hover:text-content-heading"
              >
                How it works
              </a>
              <a
                href="#closed-loop"
                className="transition-colors hover:text-content-heading"
              >
                Closed-loop workflow
              </a>
              <a
                href="#features"
                className="transition-colors hover:text-content-heading"
              >
                Features
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            {isLoading ? (
              <Skeleton className="h-9 w-28" />
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
                  Open Dashboard
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
                  Create account
                </Button>
              </>
            )}
          </div>
        </ContentContainer>
      </header>

      <main>
        {/* Hero Section */}
        <section className="border-b border-border bg-surface py-12 sm:py-16 lg:py-20">
          <ContentContainer
            size="xl"
            padded={false}
            className="px-4 sm:px-6 lg:px-8"
          >
            <div className="grid items-start gap-10 lg:grid-cols-12 lg:items-center">
              {/* Left Column: Headline & Actions */}
              <div className="space-y-6 lg:col-span-5">
                <Badge tone="primary">
                  Verified Job Discovery & Interview Readiness
                </Badge>

                <h1 className="text-3xl font-semibold tracking-tight text-content-heading sm:text-4xl lg:text-5xl lg:leading-[1.12]">
                  Know which requirements you meet before you apply.
                </h1>

                <p className="text-base leading-relaxed text-content-body">
                  Upload your resume to see which skills match your target
                  engineering roles, find your highest-priority gaps, and
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

                <div className="grid grid-cols-3 gap-3 border-t border-border pt-6">
                  <div>
                    <p className="text-base font-semibold text-content-heading tabular-nums">
                      8 of 12
                    </p>
                    <p className="mt-0.5 text-xs text-content-secondary">
                      Clear requirement denominator
                    </p>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-content-heading tabular-nums">
                      15–60 min
                    </p>
                    <p className="mt-0.5 text-xs text-content-secondary">
                      Skill-scoped mock interviews
                    </p>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-content-heading tabular-nums">
                      Direct ATS
                    </p>
                    <p className="mt-0.5 text-xs text-content-secondary">
                      Synced from company boards
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Meaningful Product Preview Using Shared Components */}
              <div className="lg:col-span-7">
                <Card padding="none" className="overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/60 px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-content-heading">
                        Product Preview
                      </span>
                      <Badge tone="neutral" size="sm">
                        Backend Engineer · Sample Role
                      </Badge>
                    </div>
                    <span className="text-xs text-content-secondary">
                      Select a stage to inspect
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
                                  <p className="text-xs font-medium text-content-secondary">
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
              </div>
            </div>
          </ContentContainer>
        </section>

        {/* Closed-Loop Workflow Strip */}
        <section
          id="closed-loop"
          className="border-b border-border bg-canvas py-12 sm:py-16"
        >
          <ContentContainer
            size="xl"
            padded={false}
            className="px-4 sm:px-6 lg:px-8"
          >
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Closed-Loop System
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-content-heading sm:text-3xl">
                Every interview updates your skill profile.
              </h2>
              <p className="text-sm leading-relaxed text-content-secondary">
                Most job tools stop at a static resume keyword score. TrueHire
                connects your resume, role requirements, and interview feedback
                into one continuous loop.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
              {CLOSED_LOOP_NODES.map((node) => (
                <Card
                  key={node.stage}
                  padding="sm"
                  className="flex flex-col justify-between"
                >
                  <div>
                    <p className="text-xs font-semibold text-primary">
                      {node.stage}
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-content-body">
                      {node.summary}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </ContentContainer>
        </section>

        {/* How It Works (4 Concrete Steps) */}
        <section
          id="how-it-works"
          className="border-b border-border bg-surface py-12 sm:py-16"
        >
          <ContentContainer
            size="xl"
            padded={false}
            className="px-4 sm:px-6 lg:px-8"
          >
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                How It Works
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-content-heading sm:text-3xl">
                Four steps from resume upload to verified readiness.
              </h2>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {WORKFLOW_STEPS.map((item) => (
                <Card key={item.step} padding="md">
                  <Badge tone="primary" size="sm">
                    Step {item.step}
                  </Badge>
                  <h3 className="mt-3 text-base font-semibold text-content-heading">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-content-secondary">
                    {item.description}
                  </p>
                </Card>
              ))}
            </div>
          </ContentContainer>
        </section>

        {/* Core Product Capabilities */}
        <section
          id="features"
          className="border-b border-border bg-canvas py-12 sm:py-16"
        >
          <ContentContainer
            size="xl"
            padded={false}
            className="px-4 sm:px-6 lg:px-8"
          >
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Core Capabilities
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-content-heading sm:text-3xl">
                Built for practical engineering preparation.
              </h2>
              <p className="text-sm leading-relaxed text-content-secondary">
                Transparent matching, source-verified job postings, and
                non-fabricated resume tailoring.
              </p>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {CORE_FEATURES.map((feat) => (
                <Card key={feat.title} padding="md">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-input border border-border bg-muted">
                    {feat.icon}
                  </div>
                  <h3 className="mt-3.5 text-base font-semibold text-content-heading">
                    {feat.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-content-secondary">
                    {feat.description}
                  </p>
                </Card>
              ))}
            </div>

            {/* Technical Credibility & Provenance Row */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card muted padding="sm" className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="text-xs font-semibold text-content-heading">
                    Non-Fabricated Tailoring
                  </p>
                  <p className="mt-0.5 text-xs text-content-secondary">
                    Rewrites are strictly bounded by your existing resume facts.
                  </p>
                </div>
              </Card>

              <Card muted padding="sm" className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-status-success" />
                <div>
                  <p className="text-xs font-semibold text-content-heading">
                    Traceable Scores
                  </p>
                  <p className="mt-0.5 text-xs text-content-secondary">
                    Every score lists the exact skills matched and missing.
                  </p>
                </div>
              </Card>

              <Card muted padding="sm" className="flex items-start gap-3">
                <Database className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="text-xs font-semibold text-content-heading">
                    Resumable Sessions
                  </p>
                  <p className="mt-0.5 text-xs text-content-secondary">
                    Pause and resume mock interviews without losing answers.
                  </p>
                </div>
              </Card>

              <Card muted padding="sm" className="flex items-start gap-3">
                <Code2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="text-xs font-semibold text-content-heading">
                    Official ATS Sources
                  </p>
                  <p className="mt-0.5 text-xs text-content-secondary">
                    Direct company board links and sync timestamps on every job.
                  </p>
                </div>
              </Card>
            </div>
          </ContentContainer>
        </section>

        {/* Single Final CTA */}
        <section className="bg-surface py-12 sm:py-16">
          <ContentContainer
            size="md"
            padded={false}
            className="px-4 sm:px-6 lg:px-8"
          >
            <Card padding="lg" className="text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-content-heading sm:text-3xl">
                See where you stand on your target roles.
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-content-secondary">
                Upload your resume to inspect your requirement coverage on real
                engineering jobs and practice targeted interviews.
              </p>
              <div className="mt-6 flex justify-center">
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
          </ContentContainer>
        </section>
      </main>

      <footer className="border-t border-border bg-canvas py-8">
        <ContentContainer
          size="xl"
          padded={false}
          className="flex flex-wrap items-center justify-between gap-4 px-4 text-xs text-content-secondary sm:px-6 lg:px-8"
        >
          <span>TrueHire · Job Discovery & Interview Readiness</span>
          <div className="flex items-center gap-5">
            <Link to="/jobs" className="hover:text-content-heading">
              Explore Jobs
            </Link>
            <Link to="/login" className="hover:text-content-heading">
              Sign in
            </Link>
            <Link to="/register" className="hover:text-content-heading">
              Create account
            </Link>
          </div>
        </ContentContainer>
      </footer>
    </div>
  );
};

export default LandingPage;
