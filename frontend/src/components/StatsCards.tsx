import clsx from 'clsx'
import { Info } from 'lucide-react'
import type { SimulationResult } from '../types'
import {
  formatCurrency,
  formatPercent,
  formatMultiple,
  gainClass,
  formatDate,
} from '../lib/formatters'

interface Props {
  result: SimulationResult
}

function StatCard({
  label,
  value,
  sub,
  valueClass,
}: {
  label: string
  value: string
  sub?: string
  valueClass?: string
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="text-muted text-xs font-mono uppercase mb-1">{label}</div>
      <div className={clsx('font-mono text-2xl font-bold', valueClass ?? 'text-text')}>{value}</div>
      {sub && <div className="text-muted text-xs mt-1">{sub}</div>}
    </div>
  )
}

export function StatsCards({ result }: Props) {
  const { stockResults, combined } = result

  // Aggregate totals
  const totalInvested = stockResults.reduce((s, r) => s + r.totalInvested, 0)
  const totalFinal = stockResults.reduce((s, r) => s + r.finalValue, 0)
  const totalReturn = totalInvested > 0 ? ((totalFinal - totalInvested) / totalInvested) * 100 : 0
  const months = combined.length
  const years = months / 12
  const combinedCAGR =
    totalInvested > 0 && years > 0
      ? (Math.pow(totalFinal / totalInvested, 1 / years) - 1) * 100
      : 0
  const multiple = totalInvested > 0 ? totalFinal / totalInvested : 0

  const best = [...stockResults].sort((a, b) => b.totalReturn - a.totalReturn)[0]
  const worst = [...stockResults].sort((a, b) => a.totalReturn - b.totalReturn)[0]

  // Detect stocks that started later than the earliest stock
  const earliestDate = stockResults.reduce(
    (min, r) => (r.firstDate < min ? r.firstDate : min),
    stockResults[0]?.firstDate ?? ''
  )
  const lateStarters = stockResults.filter((r) => r.firstDate > earliestDate)

  return (
    <div className="space-y-6">
      <h3 className="text-text font-bold text-lg">Summary</h3>

      {/* Unequal start date caveat */}
      {lateStarters.length > 0 && (
        <div className="flex items-start gap-3 bg-amber/5 border border-amber/20 rounded-xl p-4 text-sm">
          <Info size={16} className="text-amber flex-shrink-0 mt-0.5" />
          <div className="text-muted leading-relaxed">
            <span className="text-amber font-semibold">Unequal investment periods: </span>
            {lateStarters.map((r) => (
              <span key={r.symbol}>
                <span className="text-text font-mono">{r.symbol}</span> didn't exist until{' '}
                <span className="text-text">{formatDate(r.firstDate)}</span>, so fewer monthly
                contributions were made into it — which is why its "Total Invested" is lower.
                For a fair comparison, set your start date to{' '}
                <span className="text-text font-mono">{r.firstDate}</span> or later.{' '}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Top-level summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Total Invested"
          value={formatCurrency(totalInvested)}
          sub={`${Math.round(months)} months`}
        />
        <StatCard
          label="Final Value"
          value={formatCurrency(totalFinal)}
          valueClass={gainClass(totalReturn)}
        />
        <StatCard
          label="Total Return"
          value={formatPercent(totalReturn)}
          valueClass={gainClass(totalReturn)}
          sub={`${formatMultiple(multiple)} your money`}
        />
        <StatCard
          label="CAGR"
          value={formatPercent(combinedCAGR)}
          valueClass={gainClass(combinedCAGR)}
          sub="annualized"
        />
      </div>

      {/* Per-stock breakdown */}
      {stockResults.length > 0 && (
        <div>
          <h3 className="text-text font-bold text-lg mb-3">Per-Stock Results</h3>
          <div className="bg-surface border border-border rounded-xl overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-border">
                  {['Ticker', 'Invested', 'Final Value', 'Return', 'CAGR', 'Multiple'].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left text-muted font-mono text-xs px-4 py-3 uppercase"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {stockResults
                  .slice()
                  .sort((a, b) => b.totalReturn - a.totalReturn)
                  .map((r, i) => (
                    <tr
                      key={r.symbol}
                      className={clsx(
                        'border-b border-border/50 last:border-0',
                        i === 0 && 'bg-gain/5',
                        i === stockResults.length - 1 && stockResults.length > 1 && 'bg-loss/5'
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-text">{r.symbol}</div>
                        <div className="text-muted text-xs">{r.name}</div>
                        {r.firstDate > earliestDate && (
                          <div className="text-amber/70 text-xs font-mono mt-0.5">
                            ⚠ started {formatDate(r.firstDate)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-muted">
                        {formatCurrency(r.totalInvested)}
                      </td>
                      <td className={clsx('px-4 py-3 font-mono', gainClass(r.totalReturn))}>
                        {formatCurrency(r.finalValue)}
                      </td>
                      <td className={clsx('px-4 py-3 font-mono font-bold', gainClass(r.totalReturn))}>
                        {formatPercent(r.totalReturn)}
                      </td>
                      <td className={clsx('px-4 py-3 font-mono', gainClass(r.cagr))}>
                        {formatPercent(r.cagr)}
                      </td>
                      <td className={clsx('px-4 py-3 font-mono', gainClass(r.multiple - 1))}>
                        {formatMultiple(r.multiple)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Best / Worst callouts */}
      {stockResults.length > 1 && best && worst && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gain/5 border border-gain/20 rounded-xl p-5">
            <div className="text-gain text-xs font-mono uppercase mb-1">Best Performer</div>
            <div className="font-mono text-2xl font-bold text-gain">{best.symbol}</div>
            <div className="text-text font-semibold">{best.name}</div>
            <div className="text-gain font-mono mt-2 text-lg">
              {formatPercent(best.totalReturn)} · {formatMultiple(best.multiple)}
            </div>
          </div>
          <div className="bg-loss/5 border border-loss/20 rounded-xl p-5">
            <div className="text-loss text-xs font-mono uppercase mb-1">Worst Performer</div>
            <div className="font-mono text-2xl font-bold text-loss">{worst.symbol}</div>
            <div className="text-text font-semibold">{worst.name}</div>
            <div className="text-loss font-mono mt-2 text-lg">
              {formatPercent(worst.totalReturn)} · {formatMultiple(worst.multiple)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
