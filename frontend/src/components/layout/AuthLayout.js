import React from 'react';

// Same six services as the HomePage grid — repeating them here isn't
// arbitrary decoration, it's the one signature idea for these pages: "one
// portal, every civic service, reachable the moment you sign in."
const SERVICE_ICONS = [
  { icon: 'water_drop', label: 'Water Supply', top: '12%', left: '18%', delay: '0s' },
  { icon: 'bolt', label: 'Electricity', top: '6%', left: '58%', delay: '0.6s' },
  { icon: 'road', label: 'Roads', top: '38%', left: '78%', delay: '1.2s' },
  { icon: 'plumbing', label: 'Sewerage', top: '62%', left: '12%', delay: '1.8s' },
  { icon: 'description', label: 'Certificates', top: '70%', left: '52%', delay: '2.4s' },
  { icon: 'receipt_long', label: 'Property Tax', top: '42%', left: '40%', delay: '3s' },
];

const STATS = [
  { value: '6', label: 'Service categories' },
  { value: '24–48h', label: 'Avg. response time' },
  { value: 'Live', label: 'Status tracking' },
];

export default function AuthLayout({ mode = 'login', children }) {
  const isLogin = mode === 'login';

  return (
    <div className="min-h-screen flex bg-background">
      {/* Hero panel — hidden below lg, where the mobile header bar takes over */}
      <div className="hidden lg:flex lg:w-[44%] relative bg-primary overflow-hidden flex-col justify-between p-10">
        {/* Ambient gradient wash, same family as the navy/teal tokens used everywhere else */}
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(120% 100% at 0% 0%, #1a365d 0%, #002045 55%, #002526 100%)' }}
        />

        {/* Constellation of service icons, connected by faint lines — the
            "one portal, every service" idea made visual instead of stated */}
        <svg className="absolute inset-0 w-full h-full opacity-25" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line x1="18" y1="12" x2="58" y2="6" stroke="#d6e3ff" strokeWidth="0.15" />
          <line x1="58" y1="6" x2="78" y2="38" stroke="#d6e3ff" strokeWidth="0.15" />
          <line x1="78" y1="38" x2="40" y2="42" stroke="#d6e3ff" strokeWidth="0.15" />
          <line x1="40" y1="42" x2="12" y2="62" stroke="#d6e3ff" strokeWidth="0.15" />
          <line x1="12" y1="62" x2="52" y2="70" stroke="#d6e3ff" strokeWidth="0.15" />
          <line x1="52" y1="70" x2="40" y2="42" stroke="#d6e3ff" strokeWidth="0.15" />
          <line x1="18" y1="12" x2="40" y2="42" stroke="#d6e3ff" strokeWidth="0.15" />
        </svg>
        {SERVICE_ICONS.map((s) => (
          <div
            key={s.icon}
            className="absolute auth-float w-12 h-12 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center"
            style={{ top: s.top, left: s.left, animationDelay: s.delay }}
            title={s.label}
          >
            <span className="material-symbols-outlined text-primary-fixed" style={{ fontSize: 22 }}>
              {s.icon}
            </span>
          </div>
        ))}

        {/* Brand mark */}
        <div className="relative z-10 flex items-center gap-2.5">
          <span className="material-symbols-outlined text-white" style={{ fontSize: 26 }}>account_balance</span>
          <span className="font-bold text-white text-lg">DESC Citizen Portal</span>
        </div>

        {/* Headline */}
        <div className="relative z-10">
          <p className="text-primary-fixed/80 text-xs font-medium mb-3 uppercase tracking-wider">DESC — Mardan, KPK</p>
          <h1 className="text-4xl font-bold text-white leading-tight tracking-tight mb-4">
            {isLogin ? <>Welcome back to<br />your civic services</> : <>One account for<br />every civic service</>}
          </h1>
          <p className="text-white/70 text-sm max-w-xs">
            {isLogin
              ? 'Sign in to track requests, get notified the moment something changes, and rate the service you received.'
              : 'Submit requests, track them in real time, and hear back the moment your status changes — all from one account.'}
          </p>

          {/* Stat chips — true to what the app actually does, not invented marketing copy */}
          <div className="flex gap-4 mt-8">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-white font-bold text-lg leading-none">{s.value}</p>
                <p className="text-white/60 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile header bar — same brand mark, shown only below lg */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-surface border-b border-outline-variant flex items-center px-4 md:px-16 z-20">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: 28 }}>account_balance</span>
          <span className="font-bold text-primary text-lg">DESC Citizen Portal</span>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-4 pt-24 pb-12 lg:pt-12 overflow-y-auto">
        <div className="w-full max-w-[440px] auth-rise">{children}</div>
      </div>
    </div>
  );
}
