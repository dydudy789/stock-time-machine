import clsx from 'clsx'
import type { EraInfo, DCAConfig } from '../types'

interface Props {
  era: EraInfo
  selectedStocks: string[]
  config: DCAConfig
  onChange: (config: DCAConfig) => void
  onRun: () => void
  loading: boolean
}

const AMOUNT_PRESETS = [50, 100, 250, 500, 1000]

export function DCAControls({ era, selectedStocks, config, onChange, onRun, loading }: Props) {
  const accentAmber = era.color === 'amber'
  const accent = accentAmber ? 'text-amber' : 'text-teal'
  const accentBg = accentAmber ? 'bg-amber text-bg' : 'bg-teal text-bg'
  const accentBorder = accentAmber ? 'border-amber' : 'border-teal'

  const totalMonthly = config.monthlyAmount * selectedStocks.length

  // config stores YYYY-MM, parse directly without Date() to avoid timezone shift
  const months = (() => {
    if (!config.startDate || !config.endDate) return 0
    const [sy, sm] = config.startDate.split('-').map(Number)
    const [ey, em] = config.endDate.split('-').map(Number)
    return Math.max(0, (ey - sy) * 12 + (em - sm))
  })()
  const totalProjectedInvested = totalMonthly * months

  const canRun = selectedStocks.length > 0 && config.startDate && config.endDate && months > 0

  return (
    <section className="max-w-5xl mx-auto px-4 pb-16">
      <div className="mb-8">
        <div className={clsx('font-mono text-sm mb-2', accent)}>STEP 03</div>
        <h2 className="text-3xl font-bold text-text">Configure Your DCA</h2>
        <p className="text-muted mt-2">
          Dollar-cost averaging: invest a fixed amount every month, rain or shine.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Monthly amount */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <label className="block text-text font-semibold mb-4">
            Monthly Investment (per stock)
          </label>
          <div className="flex flex-wrap gap-2 mb-4">
            {AMOUNT_PRESETS.map((amt) => (
              <button
                key={amt}
                onClick={() => onChange({ ...config, monthlyAmount: amt })}
                className={clsx(
                  'px-4 py-2 rounded-lg font-mono text-sm border transition-colors',
                  config.monthlyAmount === amt
                    ? `${accentBorder} ${accentBg}`
                    : 'border-border text-muted hover:border-muted'
                )}
              >
                ${amt}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-muted text-sm">Custom:</span>
            <input
              type="number"
              min={10}
              max={100000}
              step={10}
              value={config.monthlyAmount}
              onChange={(e) =>
                onChange({ ...config, monthlyAmount: Math.max(1, Number(e.target.value)) })
              }
              className="bg-bg border border-border rounded-lg px-3 py-2 text-text font-mono w-32 focus:outline-none focus:border-teal"
            />
          </div>
          {selectedStocks.length > 1 && (
            <p className="text-muted text-xs mt-3">
              With {selectedStocks.length} stocks: ${totalMonthly.toLocaleString()} / month total
            </p>
          )}
        </div>

        {/* Date range */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <label className="block text-text font-semibold mb-4">Investment Period</label>

          <div className="space-y-4">
            <div>
              <div className="text-muted text-xs font-mono mb-1.5">START MONTH</div>
              <input
                type="month"
                min={era.dateRange.start.slice(0, 7)}
                max={config.endDate || '2025-01'}
                value={config.startDate}
                onChange={(e) => onChange({ ...config, startDate: e.target.value })}
                className="bg-bg border border-border rounded-lg px-3 py-2 text-text font-mono w-full focus:outline-none focus:border-teal"
              />
            </div>
            <div>
              <div className="text-muted text-xs font-mono mb-1.5">END MONTH</div>
              <input
                type="month"
                min={config.startDate || era.dateRange.start.slice(0, 7)}
                max="2025-12"
                value={config.endDate}
                onChange={(e) => onChange({ ...config, endDate: e.target.value })}
                className="bg-bg border border-border rounded-lg px-3 py-2 text-text font-mono w-full focus:outline-none focus:border-teal"
              />
            </div>
          </div>

          {months > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Duration</span>
                <span className="text-text font-mono">
                  {Math.floor(months / 12)}y {months % 12}m
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted">Total invested</span>
                <span className={clsx('font-mono', accent)}>
                  ${totalProjectedInvested.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Run button */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={onRun}
          disabled={!canRun || loading}
          className={clsx(
            'px-12 py-4 rounded-xl font-bold text-lg transition-all',
            canRun && !loading
              ? `${accentBg} hover:opacity-90 shadow-lg`
              : 'bg-border text-muted cursor-not-allowed'
          )}
        >
          {loading ? (
            <span className="flex items-center gap-3">
              <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Fetching price data...
            </span>
          ) : (
            'Run Simulation →'
          )}
        </button>
      </div>

      {!canRun && !loading && (
        <p className="text-center text-muted text-sm mt-3">
          {selectedStocks.length === 0
            ? 'Select at least one stock above'
            : 'Set a valid date range to continue'}
        </p>
      )}
    </section>
  )
}
