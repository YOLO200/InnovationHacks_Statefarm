import { useState, useEffect } from 'react';
import { Link } from 'react-router';

const TRIVIA: { stat: string; context: string }[] = [
  { stat: '73%', context: 'of gig workers have no employer-sponsored retirement plan.' },
  { stat: '1 in 3', context: 'gig workers have skipped a meal due to cash flow issues.' },
  { stat: '$0', context: 'is the paid sick leave most gig workers receive when they\'re ill.' },
  { stat: '57 million', context: 'Americans participate in the gig economy — nearly 36% of the workforce.' },
  { stat: '63%', context: 'of Americans can\'t cover a $500 emergency expense from savings.' },
  { stat: '40%', context: 'of gig workers say income unpredictability is their #1 financial stressor.' },
  { stat: '25–30%', context: 'of gross income should be set aside for self-employment taxes — most gig workers don\'t.' },
  { stat: '1 in 4', context: 'rideshare drivers earn below minimum wage after expenses.' },
  { stat: '78%', context: 'of Americans live paycheck to paycheck at least some of the time.' },
  { stat: '$1,200', context: 'is the average unexpected medical bill that sends gig workers into debt.' },
  { stat: '68%', context: 'of gig workers have no health insurance or are underinsured.' },
  { stat: '3.5x', context: 'more likely — gig workers are to face income gaps vs. salaried employees.' },
  { stat: '27 days', context: 'is the median cash runway for a gig worker before savings run out.' },
  { stat: '$9,000', context: 'average annual tax penalty paid by self-employed workers who underpay quarterly taxes.' },
  { stat: '1 in 5', context: 'gig workers have had a debt sent to collections in the past year.' },
  { stat: '80%', context: 'of medical bills contain errors — most go unchallenged.' },
  { stat: '45%', context: 'of gig workers report having zero emergency savings.' },
  { stat: '$46B', context: 'in medical billing errors go uncorrected annually in the U.S.' },
  { stat: '2x', context: 'Gig workers are twice as likely to miss rent during an income dip.' },
  { stat: '30%', context: 'of denied insurance claims are never appealed — and 40% of appeals succeed.' },
  { stat: '59%', context: 'of freelancers have experienced a client not paying on time.' },
  { stat: '$0', context: 'unemployment benefits available to most gig workers when work dries up.' },
  { stat: '1 in 6', context: 'gig workers has faced eviction or housing instability in the past two years.' },
  { stat: '52%', context: 'of gig workers say they have no financial plan for a slow month.' },
  { stat: '$34,000', context: 'median annual income for full-time gig workers — 30% below the national median.' },
  { stat: '3 months', context: 'is the recommended emergency fund — 71% of gig workers have less than 1 month saved.' },
  { stat: '70%', context: 'of gig workers have taken on high-interest debt to cover living expenses.' },
  { stat: '1 in 8', context: 'delivery drivers has been injured on the job with no workers\' comp coverage.' },
  { stat: '44%', context: 'of Americans say a $400 emergency would cause financial hardship.' },
  { stat: '62%', context: 'of U.S. personal bankruptcies are linked to medical bills.' },
  { stat: '$5,000', context: 'average out-of-pocket medical cost for an uninsured gig worker after an ER visit.' },
  { stat: '35%', context: 'of gig workers don\'t file taxes correctly for self-employment income.' },
  { stat: '1 in 3', context: 'gig workers has no budget and doesn\'t track monthly expenses.' },
  { stat: '85%', context: 'of gig workers say financial stress negatively impacts their job performance.' },
  { stat: '$2,100', context: 'average quarterly self-employment tax bill — often a surprise to new gig workers.' },
  { stat: '48%', context: 'of gig workers have borrowed money from family or friends in the last year.' },
  { stat: '6 weeks', context: 'average time gig workers go without income after a major illness or injury.' },
  { stat: '1 in 10', context: 'gig workers has had a vehicle repossessed while relying on it for income.' },
  { stat: '$15B', context: 'in unclaimed government assistance goes untouched by gig workers each year.' },
  { stat: '55%', context: 'of gig workers don\'t know their rights when an insurance claim is denied.' },
  { stat: '90 days', context: 'is typically how long it takes to resolve a wrongly denied insurance claim — without help.' },
  { stat: '1 in 7', context: 'gig workers has delayed medical care because they couldn\'t afford the bill upfront.' },
  { stat: '$800', context: 'average monthly swing in income for a rideshare driver between best and worst months.' },
  { stat: '38%', context: 'of gig workers say their biggest fear is a car breakdown with no savings buffer.' },
  { stat: '2 in 3', context: 'gig workers have never calculated their true hourly wage after expenses.' },
  { stat: '61%', context: 'of gig workers lack disability insurance — a single injury can end income entirely.' },
  { stat: '$300', context: 'average monthly savings gig workers could unlock by negotiating recurring bills.' },
  { stat: '1 in 4', context: 'gig workers qualifies for ACA preventive care at $0 cost — and doesn\'t know it.' },
  { stat: '42%', context: 'of gig workers have no idea how much they owe in taxes until filing season.' },
  { stat: '500,000+', context: 'gig workers filed for bankruptcy last year — nearly all due to a single financial shock.' },
];

function TriviaRotator() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * TRIVIA.length));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex(i => (i + 1) % TRIVIA.length);
        setVisible(true);
      }, 400);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const item = TRIVIA[index];

  return (
    <div
      className="transition-all duration-400"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(8px)' }}
    >
      <div className="text-5xl font-black mb-2" style={{ color: '#93c5fd', letterSpacing: '-2px' }}>
        {item.stat}
      </div>
      <p className="text-white/70 text-sm leading-relaxed max-w-xs mx-auto">{item.context}</p>
    </div>
  );
}

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
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold mb-8"
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

        {/* Trivia rotator */}
        <div className="mb-10 rounded-2xl px-10 py-8 text-center min-h-[120px] flex flex-col items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: '420px' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-4">Did you know?</p>
          <TriviaRotator />
        </div>

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
        <div className="flex flex-wrap justify-center gap-3 mt-4">
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
