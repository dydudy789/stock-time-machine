import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { CombinedSnapshot, StockDCAResult } from '../types'
import { formatCurrency, formatDate } from '../lib/formatters'

const DARLING_COLORS = ['#00d4aa', '#f59e0b', '#818cf8', '#60a5fa', '#34d399', '#fbbf24', '#4ade80']
const OUTCAST_COLORS = ['#fb923c', '#f87171', '#e879f9', '#facc15', '#a78bfa']

interface Props {
  data: CombinedSnapshot[]
  symbols: string[]
  stockResults: StockDCAResult[]
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-surface border border-border rounded-xl p-3 text-xs font-mono shadow-xl">
      <div className="text-muted mb-2">{formatDate(label as string)}</div>
      {payload
        .slice()
        .sort((a: any, b: any) => b.value - a.value)
        .map((p: any) => (
          <div key={p.name} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
            <span className="text-muted w-28 truncate">{p.name}</span>
            <span className="text-text ml-auto">{formatCurrency(p.value)}</span>
          </div>
        ))}
    </div>
  )
}

export function ResultsChart({ data, symbols, stockResults }: Props) {
  const showPerStock = symbols.length > 1

  // Build color map — outcasts get orange palette, darlings get teal/amber
  const colorMap: Record<string, string> = {}
  let darlingIdx = 0
  let outcastIdx = 0
  for (const r of stockResults) {
    if (r.isOutcast) {
      colorMap[r.symbol] = OUTCAST_COLORS[outcastIdx % OUTCAST_COLORS.length]
      outcastIdx++
    } else {
      colorMap[r.symbol] = DARLING_COLORS[darlingIdx % DARLING_COLORS.length]
      darlingIdx++
    }
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <h3 className="text-text font-bold text-lg mb-6">Portfolio Growth Over Time</h3>

      <ResponsiveContainer width="100%" height={420}>
        <ComposedChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />

          <XAxis
            dataKey="date"
            tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: string) => {
              const [y, m] = v.split('-')
              return m === '01' ? y : ''
            }}
          />

          <YAxis
            tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => formatCurrency(v)}
            width={80}
          />

          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'monospace', color: '#64748b' }} />

          {/* Total invested — dashed baseline */}
          <Line
            type="monotone"
            dataKey="totalInvested"
            name="Total Invested"
            stroke="#64748b"
            strokeDasharray="6 3"
            strokeWidth={1.5}
            dot={false}
          />

          {showPerStock ? (
            symbols.map((sym) => (
              <Line
                key={sym}
                type="monotone"
                dataKey={sym}
                name={sym}
                stroke={colorMap[sym] ?? '#00d4aa'}
                strokeWidth={2}
                dot={false}
              />
            ))
          ) : (
            <Area
              type="monotone"
              dataKey="portfolioValue"
              name="Portfolio Value"
              stroke="#00d4aa"
              fill="#00d4aa"
              fillOpacity={0.15}
              strokeWidth={2.5}
              dot={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {showPerStock && (
        <div className="mt-4 flex flex-wrap gap-3">
          {stockResults.map((r) => (
            <div key={r.symbol} className="flex items-center gap-1.5 text-xs font-mono">
              <div className="w-3 h-1.5 rounded-full" style={{ background: colorMap[r.symbol] }} />
              <span className="text-muted">{r.symbol}</span>
              {r.isOutcast && (
                <span className="text-orange-400/70 text-xs">★ outcast</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
