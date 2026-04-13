import { TrendingUp } from 'lucide-react'

export function Hero({ onStart }: { onStart: () => void }) {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-4 text-center relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,212,170,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,170,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-teal/5 blur-[120px]" />

      <div className="relative z-10 max-w-4xl">
        <div className="inline-flex items-center gap-2 border border-teal/30 rounded-full px-4 py-1.5 text-teal text-sm font-mono mb-8">
          <TrendingUp size={14} />
          Historical DCA Simulator · 1980 – 2015
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-text leading-none mb-6 tracking-tight">
          Stock{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal to-teal-dim">
            Time Machine
          </span>
        </h1>

        <p className="text-muted text-lg md:text-xl max-w-2xl mx-auto mb-3">
          What if you had invested $100 a month into Apple when everyone called it dead?
          Or Microsoft the year it IPO'd? Or Amazon after it crashed 95%?
        </p>

        <p className="text-muted/60 text-sm font-mono mb-12">
          Real historical data · Includes dividends · No accounts · No BS
        </p>

        <button
          onClick={onStart}
          className="bg-teal text-bg px-8 py-4 rounded-xl font-bold text-lg hover:bg-teal-dim transition-colors"
        >
          Travel Back in Time →
        </button>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 text-left">
          {[
            { label: 'Eras', value: '7', sub: '1980 – 2015' },
            { label: 'Stocks', value: '70+', sub: 'Darlings & outcasts' },
            { label: 'Data', value: '45yr', sub: 'Real monthly prices' },
            { label: 'Dividends', value: '✓', sub: 'Fully included' },
          ].map(({ label, value, sub }) => (
            <div
              key={label}
              className="border border-border rounded-xl p-4 bg-surface/50"
            >
              <div className="font-mono text-3xl font-bold text-teal">{value}</div>
              <div className="text-text font-semibold text-sm mt-1">{label}</div>
              <div className="text-muted text-xs">{sub}</div>
            </div>
          ))}
        </div>

        {/* Era timeline */}
        <div className="mt-12 flex items-center justify-center gap-0 text-xs font-mono overflow-x-auto">
          {[
            { years: '1980–85', label: 'Morning\nin America' },
            { years: '1985–90', label: 'Roaring\nEighties' },
            { years: '1990–95', label: 'Blue\nChips' },
            { years: '1995–00', label: 'Dot-Com\nBoom' },
            { years: '2000–05', label: 'Crash &\nSurvivors' },
            { years: '2005–10', label: 'Boom &\nCrash' },
            { years: '2010–15', label: 'Mobile\nExplosion' },
          ].map((era, i) => (
            <div key={era.years} className="flex items-center">
              <div className="text-center px-2">
                <div className="text-teal/70 text-xs">{era.years}</div>
                <div className="text-muted/50 text-xs whitespace-pre-line leading-tight mt-0.5">{era.label}</div>
              </div>
              {i < 6 && <div className="text-border mx-1">→</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
