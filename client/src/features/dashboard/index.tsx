import React from 'react';
import { FileText, Briefcase, Zap, Video, CheckCircle } from 'lucide-react';

export const DashboardFeature: React.FC = () => {
  const cards = [
    { title: 'Resume Pipeline', icon: FileText, desc: 'Parse & optimize your technical CV' },
    { title: 'Greenhouse Job Ingestion', icon: Briefcase, desc: 'Live job feed & ATS parsing' },
    { title: 'Matching & Skill Gaps', icon: Zap, desc: 'AI-driven match scoring' },
    { title: 'Mock AI Interview', icon: Video, desc: 'Realtime interactive interview simulator' },
    { title: 'Application Tracker', icon: CheckCircle, desc: 'Stage tracking & closed loop optimization' },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white">TrueHire Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Stage 0 — Vertical Architecture Baseline</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-brand-500/50 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400 mb-3 group-hover:bg-brand-500/20 transition-all">
                <Icon size={20} />
              </div>
              <h3 className="font-semibold text-slate-100">{card.title}</h3>
              <p className="text-xs text-slate-400 mt-1">{card.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
