import React, { useState, useEffect } from 'react';
import { fetchHealth, HealthData } from './services/health';
import { DashboardFeature } from './features/dashboard';
import { AuthFeature } from './features/auth';
import { ResumeFeature } from './features/resume';
import { JobsFeature } from './features/jobs';
import { MatchingFeature } from './features/matching';
import { InterviewFeature } from './features/interview';
import { TrackerFeature } from './features/tracker';
import { 
  Activity, 
  Database, 
  LayoutDashboard, 
  User, 
  FileText, 
  Briefcase, 
  Zap, 
  Video, 
  CheckSquare, 
  RefreshCw,
  Server
} from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHealth();
      setHealth(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Backend unreachable');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'auth', label: 'Authentication', icon: User },
    { id: 'resume', label: 'Resume Pipeline', icon: FileText },
    { id: 'jobs', label: 'Job Ingestion', icon: Briefcase },
    { id: 'matching', label: 'Matching & Gaps', icon: Zap },
    { id: 'interview', label: 'Mock Interview', icon: Video },
    { id: 'tracker', label: 'App Tracker', icon: CheckSquare },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      {/* Header Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold shadow-lg shadow-brand-600/30">
            TH
          </div>
          <div>
            <span className="font-bold text-lg text-white tracking-tight">TrueHire</span>
            <span className="ml-2 text-xs bg-slate-800 text-brand-400 px-2 py-0.5 rounded-full font-mono border border-slate-700">
              Stage 0 — Foundation
            </span>
          </div>
        </div>

        {/* Server Health Status Pill */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs">
            <Server size={14} className="text-slate-400" />
            <span className="text-slate-400 font-medium">API Server:</span>
            {loading ? (
              <RefreshCw size={12} className="animate-spin text-slate-400" />
            ) : error ? (
              <span className="inline-flex items-center text-red-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-red-500 mr-1.5 animate-pulse"></span>
                Disconnected
              </span>
            ) : (
              <span className="inline-flex items-center text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>
                Healthy ({health?.version})
              </span>
            )}
          </div>

          {health && (
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs">
              <Database size={14} className="text-slate-400" />
              <span className="text-slate-400 font-medium">DB:</span>
              <span className={health.database.connected ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                {health.database.connected ? 'Connected' : 'Offline'}
              </span>
            </div>
          )}

          <button 
            onClick={loadHealth}
            title="Refresh Server Health"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-800 bg-slate-900/40 p-4 space-y-1 hidden md:block">
          <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-brand-600/10 text-brand-400 border border-brand-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-6 px-3">
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center text-slate-300 font-semibold">
                <Activity size={14} className="mr-1.5 text-brand-400" />
                Backend Status
              </div>
              <p className="text-slate-400">
                {error ? error : `Uptime: ${health?.uptime ? Math.floor(health.uptime) + 's' : 'Connecting...'}`}
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'dashboard' && <DashboardFeature />}
          {activeTab === 'auth' && <AuthFeature />}
          {activeTab === 'resume' && <ResumeFeature />}
          {activeTab === 'jobs' && <JobsFeature />}
          {activeTab === 'matching' && <MatchingFeature />}
          {activeTab === 'interview' && <InterviewFeature />}
          {activeTab === 'tracker' && <TrackerFeature />}
        </main>
      </div>
    </div>
  );
};

export default App;
