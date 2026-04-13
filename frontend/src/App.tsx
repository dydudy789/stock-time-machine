import { useState, useRef } from 'react'
import { Hero } from './components/Hero'
import { EraSelector } from './components/EraSelector'
import { StockPicker } from './components/StockPicker'
import { DCAControls } from './components/DCAControls'
import { ResultsChart } from './components/ResultsChart'
import { StatsCards } from './components/StatsCards'
import { getEraById, INDEX_STOCKS } from './data/eras'
import { fetchPricesBulk } from './lib/api'
import { runSimulation } from './lib/dca'
import type { EraId, DCAConfig, SimulationResult } from './types'
import { AlertCircle, RotateCcw } from 'lucide-react'
import clsx from 'clsx'

export default function App() {
  const [selectedEra, setSelectedEra] = useState<EraId | null>(null)
  const [selectedStocks, setSelectedStocks] = useState<string[]>([])
  const [dcaConfig, setDcaConfig] = useState<DCAConfig>({
    monthlyAmount: 100,
    startDate: '',
    endDate: '2025-01',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SimulationResult | null>(null)

  const simulatorRef = useRef<HTMLDivElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  function handleStart() {
    simulatorRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function handleEraSelect(era: EraId) {
    setSelectedEra(era)
    setSelectedStocks([])
    setResult(null)
    setError(null)
    const eraInfo = getEraById(era)
    if (eraInfo) {
      // Store as YYYY-MM for the month picker
      setDcaConfig((c) => ({ ...c, startDate: eraInfo.dateRange.start.slice(0, 7) }))
    }
  }

  function handleToggleStock(symbol: string) {
    setSelectedStocks((prev) =>
      prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]
    )
    setResult(null)
  }

  async function handleRun() {
    if (!selectedEra || selectedStocks.length === 0) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Append -01 to convert YYYY-MM → YYYY-MM-01 for the API
      const startFull = dcaConfig.startDate + '-01'
      const endFull = dcaConfig.endDate + '-01'
      const priceMap = await fetchPricesBulk(selectedStocks, startFull, endFull)

      const eraInfo = getEraById(selectedEra)!
      const nameMap: Record<string, string> = {}
      for (const s of [...eraInfo.stocks, ...eraInfo.outcasts, ...INDEX_STOCKS]) {
        nameMap[s.symbol] = s.name
      }

      const outcastSymbols = new Set(eraInfo.outcasts.map((s) => s.symbol))
      const simulation = runSimulation(priceMap, nameMap, outcastSymbols, {
        ...dcaConfig,
        startDate: startFull,
        endDate: endFull,
      })

      if (simulation.stockResults.length === 0) {
        throw new Error('No price data returned. Try adjusting the date range.')
      }

      setResult(simulation)
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setResult(null)
    setError(null)
    simulatorRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const era = selectedEra ? getEraById(selectedEra) : null
  const accentAmber = era?.color === 'amber'

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
            <button
              onClick={handleReset}
              className="flex items-center gap-2 text-muted hover:text-text text-sm border border-border rounded-lg px-4 py-2 transition-colors"
            >
              <RotateCcw size={14} />
              Run Another
            </button>
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
