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
  const [copied, setCopied] = useState(false)

  const simulatorRef = useRef<HTMLDivElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const autoRanRef = useRef(false)

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

      setResult(simulation)
      track('simulation-run', {
        era,
        stocks: stocks.join(','),
        amount: config.monthlyAmount,
      })

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
    setSelectedEra(era)
    setSelectedStocks([])
    setResult(null)
    setError(null)
    track('era-selected', { era })
    const eraInfo = getEraById(era)
    if (eraInfo) {
      setDcaConfig((c) => ({ ...c, startDate: eraInfo.dateRange.start.slice(0, 7) }))
    }
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
              onChange={setDcaConfig}
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
          <div className="flex items-center justify-between">
            <div>
              <div className="text-teal font-mono text-sm mb-1">RESULTS</div>
              <h2 className="text-3xl font-bold text-text">Your Simulation Results</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 text-muted hover:text-text text-sm border border-border rounded-lg px-4 py-2 transition-colors"
              >
                {copied ? <Check size={14} className="text-teal" /> : <Share2 size={14} />}
                {copied ? 'Copied!' : 'Share'}
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 text-muted hover:text-text text-sm border border-border rounded-lg px-4 py-2 transition-colors"
              >
                <RotateCcw size={14} />
                Run Another
              </button>
            </div>
          </div>

          <ResultsChart data={result.combined} symbols={selectedStocks} stockResults={result.stockResults} />
          <StatsCards result={result} />

          {/* How the stories ended */}
          <div>
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
