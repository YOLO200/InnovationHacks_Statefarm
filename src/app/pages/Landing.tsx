import { Link } from 'react-router';

export function Landing() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #0f1535 0%, #1a237e 50%, #2d3dbd 100%)' }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-10 py-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#2d3dbd', border: '1.5px solid rgba(255,255,255,0.2)' }}>
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="text-white font-black text-xl tracking-tight">Crunch</span>
        </div>
        <Link
          to="/onboarding"
          className="text-sm font-bold text-white/80 hover:text-white transition-colors"
        >
          Get Started →
        </Link>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-8"
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          AI-Powered Financial Wellness for Gig Workers
        </div>

        {/* Headline */}
        <h1 className="text-6xl font-black text-white mb-6 leading-tight max-w-3xl" style={{ letterSpacing: '-2px' }}>
          Know exactly where
          <br />
          <span style={{ color: '#93c5fd' }}>you stand financially.</span>
        </h1>

        <p className="text-lg text-white/60 mb-12 max-w-xl leading-relaxed">
          Upload a bank statement. Get your financial health score, cash runway,
          crisis plan, and medical bill analyzer — built for the gig economy.
        </p>

        {/* CTA */}
        <Link
          to="/onboarding"
          className="inline-flex items-center gap-3 text-base font-black px-8 py-4 rounded-2xl text-white transition-all hover:scale-105 hover:shadow-2xl shadow-lg"
          style={{ background: 'linear-gradient(135deg, #3b4fe8 0%, #2d3dbd 100%)', border: '1px solid rgba(255,255,255,0.2)' }}
        >
          Start Onboarding
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>

        <p className="mt-4 text-xs text-white/30">No account needed · Your data stays on your device</p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-16">
          {[
            { icon: '📊', label: 'Financial Health Score' },
            { icon: '⏱️', label: 'Cash Runway Calculator' },
            { icon: '🚨', label: 'Crisis Advisor' },
            { icon: '🛡️', label: 'Medical Bill Analyzer' },
            { icon: '📁', label: 'Bank Statement OCR' },
          ].map(f => (
            <div key={f.label}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}>
              <span>{f.icon}</span>
              {f.label}
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-white/20">
        Built for Innovation Hacks · State Farm · 2025
      </footer>
    </div>
  );
}
