import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

const STEPS = [
  {
    title: "Match",
    body: "Upload a resume and see how it compares with a job, skill by skill.",
  },
  {
    title: "Prepare",
    body: "Each gap is ranked by how often the posting names it, so you know what matters most.",
  },
  {
    title: "Interview",
    body: "Answer questions written for that role. Each answer is scored against a rubric.",
  },
  {
    title: "Improve",
    body: "Skills your interview flagged carry into your next match and your next interview.",
  },
];

export const LandingPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-gray-950 text-slate-100">
      <header>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="text-lg font-bold text-white">TrueHire</span>
          <nav aria-label="Main" className="flex items-center gap-2 text-sm">
            <a href="#how-it-works" className="rounded-lg px-3 py-2 text-slate-400 hover:text-white">
              How it works
            </a>
            <Link to="/login" className="rounded-lg px-3 py-2 text-slate-400 hover:text-white">
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-teal-700 px-3 py-2 font-medium text-white hover:bg-teal-600"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-10 pt-14 text-center">
          <h1 className="landing-rise text-3xl font-semibold tracking-tight text-white sm:text-7xl lg:text-8xl">
            From job description to interview-ready.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg text-slate-400">
            TrueHire compares your resume with verified jobs, shows your gaps in plain terms, and runs
            mock interviews whose results feed back into your preparation.
          </p>
          <div className="landing-rise mt-8 flex flex-wrap justify-center gap-3" style={{ animationDelay: "120ms" }}>
            <Link
              to="/register"
              className="rounded-xl bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
            >
              Get started
            </Link>
            <a
              href="#how-it-works"
              className="rounded-xl border border-gray-700 px-5 py-3 font-medium text-white hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
            >
              See how it works
            </a>
          </div>
          <img
            src="/landing/dashboard-preview.png"
            alt="The TrueHire dashboard: a next step, flagged skills, and recent applications. The figures are sample data."
            width={1280}
            height={720}
            className="landing-rise mx-auto mt-10 w-full max-w-4xl rounded-xl bg-gray-900"
            style={{ animationDelay: "240ms" }}
          />
        </section>

        <section className="px-4 pb-4">
          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
            {[
              ["/landing/resume-preview.png", "Resume, parsed into skills you can check"],
              ["/landing/match-preview.png", "A match score with each gap explained"],
              ["/landing/tailoring-preview.png", "Suggestions limited to what your resume supports"],
            ].map(([src, caption]) => (
              <figure key={src} className="reveal">
                <img
                  src={src}
                  alt={`${caption}. Sample data.`}
                  width={1280}
                  height={720}
                  loading="lazy"
                  className="w-full rounded-xl bg-gray-900"
                />
                <figcaption className="mt-3 text-pretty text-sm text-slate-400">{caption}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="py-16">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <div key={step.title} className="reveal rounded-2xl bg-gray-900 p-6">
                <p className="text-sm text-slate-400">Step {index + 1}</p>
                <h2 className="mt-2 text-lg font-semibold text-white">{step.title}</h2>
                <p className="mt-2 text-pretty text-sm text-slate-400">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-2">
            <div className="reveal">
              <h2 className="text-2xl font-semibold text-white">Every job has a source you can check</h2>
              <p className="mt-3 text-slate-400">
                Listings come from the company's own job board through its official applicant tracking
                system. Each job shows where it came from and when it was last synced.
              </p>
            </div>
            <div className="reveal">
              <h2 className="text-2xl font-semibold text-white">Scores you can trace</h2>
              <p className="mt-3 text-slate-400">
                A match score comes from named skills. Every gap says why it matters. When a posting
                lists no skills we can compare, TrueHire says so instead of guessing a number.
              </p>
            </div>
            <img
              src="/landing/skill-gap-preview.png"
              alt="The skill-gap report: a match score, priority gaps with the evidence behind each one, and matched skills. The figures are sample data."
              width={1280}
              height={720}
              loading="lazy"
              className="reveal rounded-xl bg-gray-900 md:col-span-2"
            />
          </div>
        </section>
      </main>

      <footer className="py-8">
        <p className="mx-auto max-w-6xl px-4 text-sm text-slate-400">TrueHire</p>
      </footer>
    </div>
  );
};

export default LandingPage;
