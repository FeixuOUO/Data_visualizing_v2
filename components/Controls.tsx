import React from 'react';

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const Toggle: React.FC<ToggleProps> = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-slate-700/30 last:border-0 group">
    <span className="text-slate-400 text-sm font-medium group-hover:text-slate-300 transition-colors">{label}</span>
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-1 focus:ring-offset-slate-900 ${
        checked ? 'bg-blue-500' : 'bg-slate-700'
      }`}
    >
      <span
        className={`${
          checked ? 'translate-x-4' : 'translate-x-1'
        } inline-block h-3 w-3 transform rounded-full bg-white transition-transform shadow-sm`}
      />
    </button>
  </div>
);

export const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl ${className}`}>
    {children}
  </div>
);