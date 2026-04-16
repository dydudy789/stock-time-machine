import { useState, useRef, useEffect, useCallback } from 'react'
import { Hero } from './components/Hero'
import { EraSelector } from './components/EraSelector'
import { StockPicker } from './components/StockPicker'
import { DCAControls } from './components/DCAControls'
import { ResultsChart } from './components/ResultsChart'
import { StatsCards } from './components/StatsCards'
import { getEraById, INDEX_STOCKS } from './data/eras'
import { fetchPricesBulk } from './lib/api'
import { runSimulation } from './lib/dca'
import { track } from './lib/analytics'
import type { EraId, DCAConfig, SimulationResult } from './types'
import { AlertCircle, RotateCcw, Share2, Check } from 'lucide-react'
import clsx from 'clsx'

function parseUrlParams() {
  const p = new URLSearchParams(window.location.search)
  return {
    era: (p.get('era') as EraId) || null,
    stocks: p.get('stocks')?.split(',').filter(Boolean) ?? [],
    amount: Number(p.get('amount')) || 100,
    start: p.get('start') || '',
    end: p.get('end') || '2025-01',
  }
}

export default function App() {
  const initial = parseUrlParams()

  const [selectedEra, setSelectedEra] = useState<EraId | null>(initial.era)
  const [selectedStocks, setSelectedStocks] = useState<string[]>(initial.stocks)
  const [dcaConfig, setDcaConfig] = useState<DCAConfig>(() => {
    const eraInfo = initial.era ? getEraById(initial.era) : null
    return {
      monthlyAmount: initial.amount,
      startDate: initial.start || eraInfo?.dateRange.start.slice(0, 7) || '',
      endDate: initial.end,
    }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [skippedStocks, setSkippedStocks] = useState<{ symbol: string; availableFrom: string }[]>([])
  const [copied, setCopied] = useState(false)

  const simulatorRef = useRef<HTMLDivElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const storiesRef = useRef<HTMLDivElement>(null)
  const autoRanRef = useRef(false)
  const resultScrolledRef = useRef(false)
  const pageLoadTime = useRef(Date.now())
  const firstRunDone = useRef(false)
  const defaultDatesRef = useRef({ start: dcaConfig.startDate, end: dcaConfig.endDate })
  const startModifiedRef = useRef(false)
  const endModifiedRef = useRef(false)

  // simulation-abandoned: fire on page leave if stocks were picked but never run
  useEffect(() => {
    const handler = () => {
      if (selectedStocks.length > 0 && !result) {
        track('simulation-abandoned', { era: selectedEra ?? '', stocks_selected: selectedStocks.length })
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [selectedStocks, result, selectedEra])

  // result-scrolled: fire once when "How the Stories Ended" enters the viewport
  useEffect(() => {
    if (!result) {
      resultScrolledRef.current = false
      return
    }
    const el = storiesRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !resultScrolledRef.current) {
          resultScrolledRef.current = true
          track('result-scrolled', { era: selectedEra ?? '' })
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [result, selectedEra])

  // Keep URL in sync with current config
  useEffect(() => {
    if (!selectedEra) return
    const p = new URLSearchParams()
    p.set('era', selectedEra)
    if (selectedStocks.length) p.set('stocks', selectedStocks.join(','))
    p.set('amount', String(dcaConfig.monthlyAmount))
    if (dcaConfig.startDate) p.set('start', dcaConfig.startDate)
    if (dcaConfig.endDate) p.set('end', dcaConfig.endDate)
    window.history.replaceState(null, '', '?' + p.toString())
  }, [selectedEra, selectedStocks, dcaConfig])

  const runSimulationFn = useCallback(async (
    era: EraId,
    stocks: string[],
    config: DCAConfig,
  ) => {
    if (!era || stocks.length === 0) return

    setLoading(true)
    setError(null)
    setResult(null)
    setSkippedStocks([])

    try {
      const startFull = config.startDate + '-01'
      const endFull = config.endDate + '-01'
      const priceMap = await fetchPricesBulk(stocks, startFull, endFull)

      const eraInfo = getEraById(era)!
      const nameMap: Record<string, string> = {}
      for (const s of [...eraInfo.stocks, ...eraInfo.outcasts, ...INDEX_STOCKS]) {
        nameMap[s.symbol] = s.name
      }

      const outcastSymbols = new Set(eraInfo.outcasts.map((s) => s.symbol))
      const simulation = runSimulation(priceMap, nameMap, outcastSymbols, {
        ...config,
        startDate: startFull,
        endDate: endFull,
      })

      if (simulation.stockResults.length === 0) {
        throw new Error('No price data returned. Try adjusting the date range.')
      }

      // Detect stocks that returned no data (e.g. IPO after start date)
      const eraAllStocks = [...eraInfo.stocks, ...eraInfo.outcasts, ...INDEX_STOCKS]
      const returnedSymbols = new Set(simulation.stockResults.map((r) => r.symbol))
      const skipped = stocks
        .filter((sym) => !returnedSymbols.has(sym))
        .map((sym) => {
          const info = eraAllStocks.find((s) => s.symbol === sym)
          return { symbol: sym, availableFrom: info?.availableFrom ?? '' }
        })
      setSkippedStocks(skipped)

      if (simulation.stockResults.length === 0) {
        const reasons = skipped.map((s) =>
          s.availableFrom
            ? `${s.symbol} wasn't available until ${new Date(s.availableFrom).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
            : s.symbol
        )
        throw new Error(`No price data for the selected period. ${reasons.join(', ')}.`)
      }

      setResult(simulation)
      const timeToRun = Math.round((Date.now() - pageLoadTime.current) / 1000)
      track('simulation-run', {
        era,
        stocks: stocks.join(','),
        amount: config.monthlyAmount,
        ...(firstRunDone.current ? {} : { time_to_first_run_seconds: timeToRun }),
      })
      firstRunDone.current = true

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-run if page was loaded from a shared link with all params
  useEffect(() => {
    if (autoRanRef.current) return
    if (initial.era && initial.stocks.length > 0 && initial.start) {
      autoRanRef.current = true
      runSimulationFn(initial.era, initial.stocks, {
        monthlyAmount: initial.amount,
        startDate: initial.start,
        endDate: initial.end,
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleStart() {
    simulatorRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function handleEraSelect(era: EraId) {
    if (selectedEra && selectedEra !== era) {
      track('era-changed', { from: selectedEra, to: era })
      if (selectedStocks.length > 0 && !result) {
        track('simulation-abandoned', { era: selectedEra, stocks_selected: selectedStocks.length })
      }
    }
    setSelectedEra(era)
    setSelectedStocks([])
    setResult(null)
    setError(null)
    track('era-selected', { era })
    const eraInfo = getEraById(era)
    if (eraInfo) {
      const defaultStart = eraInfo.dateRange.start.slice(0, 7)
      defaultDatesRef.current = { start: defaultStart, end: '2025-01' }
      startModifiedRef.current = false
      endModifiedRef.current = false
      setDcaConfig((c) => ({ ...c, startDate: defaultStart }))
    }
  }

  function handleConfigChange(newConfig: DCAConfig) {
    if (!startModifiedRef.current && newConfig.startDate !== dcaConfig.startDate &&
        newConfig.startDate !== defaultDatesRef.current.start) {
      startModifiedRef.current = true
      track('date-range-modified', { field: 'start', era: selectedEra ?? '' })
    }
    if (!endModifiedRef.current && newConfig.endDate !== dcaConfig.endDate &&
        newConfig.endDate !== defaultDatesRef.current.end) {
      endModifiedRef.current = true
      track('date-range-modified', { field: 'end', era: selectedEra ?? '' })
    }
    setDcaConfig(newConfig)
  }

  function handleToggleStock(symbol: string) {
    setSelectedStocks((prev) => {
      const next = prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]
      track('stock-toggled', { symbol, action: prev.includes(symbol) ? 'remove' : 'add' })
      return next
    })
    setResult(null)
  }

  async function handleRun() {
    if (!selectedEra) return
    await runSimulationFn(selectedEra, selectedStocks, dcaConfig)
  }

  function handleReset() {
    setResult(null)
    setError(null)
    simulatorRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      track('share-clicked')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const era = selectedEra ? getEraById(selectedEra) : null

  return (
    <div className="min-h-screen bg-bg text-text">
      <Hero onStart={handleStart} />

      <div ref={simulatorRef}>
        <EraSelector selected={selectedEra} onSelect={handleEraSelect} />

        {era && (
          <>
            <StockPicker era={era} selected={selectedStocks} onToggle={handleToggleStock} />
            <DCAControls
              era={era}
              selectedStocks={selectedStocks}
              config={dcaConfig}
              onChange={handleConfigChange}
              onRun={handleRun}
              loading={loading}
            />
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="max-w-6xl mx-auto px-4 pb-8">
          <div className="flex items-start gap-3 bg-loss/10 border border-loss/30 rounded-xl p-4 text-loss text-sm">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold mb-1">Error running simulation</div>
              <div className="font-mono text-xs">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && era && (
        <div ref={resultsRef} className="max-w-6xl mx-auto px-4 pb-24 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="text-teal font-mono text-sm mb-1">RESULTS</div>
              <h2 className="text-3xl font-bold text-text">Your Simulation Results</h2>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 text-muted hover:text-text text-sm border border-border rounded-lg px-4 py-2 transition-colors"
              >
                {copied ? <Check size={14} className="text-teal" /> : <Share2 size={14} />}
                <span>{copied ? 'Copied!' : 'Share'}</span>
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 text-muted hover:text-text text-sm border border-border rounded-lg px-4 py-2 transition-colors"
              >
                <RotateCcw size={14} />
                <span>Run Another</span>
              </button>
            </div>
          </div>

          {skippedStocks.length > 0 && (
            <div className="flex items-start gap-3 bg-amber/5 border border-amber/20 rounded-xl p-4 text-sm">
              <AlertCircle size={16} className="text-amber flex-shrink-0 mt-0.5" />
              <div className="text-muted">
                <span className="text-amber font-semibold">Some stocks were excluded: </span>
                {skippedStocks.map((s, i) => (
                  <span key={s.symbol}>
                    {i > 0 && ', '}
                    <span className="text-text font-mono">{s.symbol}</span>
                    {s.availableFrom && (
                      <span className="text-muted/70"> (IPO'd {new Date(s.availableFrom).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})</span>
                    )}
                  </span>
                ))}
                {' '}— no price data exists before their listing date.
              </div>
            </div>
          )}

          <ResultsChart data={result.combined} symbols={selectedStocks} stockResults={result.stockResults} />
          <StatsCards result={result} />

          {/* How the stories ended */}
          <div ref={storiesRef}>
            <h3 className="text-text font-bold text-lg mb-4">How the Stories Ended</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {result.stockResults.map((r) => {
                const allStocks = [...era.stocks, ...era.outcasts, ...INDEX_STOCKS]
                const stockInfo = allStocks.find((s) => s.symbol === r.symbol)
                if (!stockInfo?.outcome) return null
                return (
                  <div
                    key={r.symbol}
                    className={clsx(
                      'border rounded-xl p-4 text-sm',
                      r.isOutcast
                        ? 'bg-orange-400/5 border-orange-400/20'
                        : 'bg-surface border-border'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="font-mono font-bold text-text">{r.symbol}</div>
                      {r.isOutcast && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-400/20 text-orange-400 font-mono">
                          outcast
                        </span>
                      )}
                    </div>
                    <p className="text-muted leading-relaxed">{stockInfo.outcome}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <p className="text-muted text-xs text-center font-mono border-t border-border pt-6">
            Past performance is not indicative of future results. This is for educational purposes only.
          </p>
        </div>
      )}
    </div>
  )
}
