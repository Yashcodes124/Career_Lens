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
      <header className="border-b border-gray-800">
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
              className="rounded-lg bg-indigo-600 px-3 py-2 font-medium text-white hover:bg-indigo-500"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            From job description to interview-ready.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-400">
            TrueHire compares your resume with verified jobs, shows your gaps in plain terms, and runs
            mock interviews whose results feed back into your preparation.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/register"
              className="rounded-xl bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
            >
              Get started
            </Link>
            <a
              href="#how-it-works"
              className="rounded-xl border border-gray-700 px-5 py-3 font-medium text-white hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
            >
              See how it works
            </a>
          </div>
        </section>

        <section id="how-it-works" className="border-t border-gray-800 py-16">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <div key={step.title} className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
                <p className="text-sm text-slate-500">Step {index + 1}</p>
                <h2 className="mt-2 text-lg font-semibold text-white">{step.title}</h2>
                <p className="mt-2 text-sm text-slate-400">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-gray-800 py-16">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold text-white">Every job has a source you can check</h2>
              <p className="mt-3 text-slate-400">
                Listings come from the company's own job board through its official applicant tracking
                system. Each job shows where it came from and when it was last synced.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">Scores you can trace</h2>
              <p className="mt-3 text-slate-400">
                A match score comes from named skills. Every gap says why it matters. When a posting
                lists no skills we can compare, TrueHire says so instead of guessing a number.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-800 py-8">
        <p className="mx-auto max-w-6xl px-4 text-sm text-slate-500">TrueHire</p>
      </footer>
    </div>
  );
};

export default LandingPage;
