import { Info, Star, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'
import { INDEX_STOCKS } from '../data/eras'
import type { EraInfo, StockInfo } from '../types'

interface StockCardProps {
  stock: StockInfo
  selected: boolean
  onToggle: () => void
  accentAmber: boolean
  variant?: 'darling' | 'outcast' | 'index'
}

function StockCard({ stock, selected, onToggle, accentAmber, variant = 'darling' }: StockCardProps) {
  const isOutcast = variant === 'outcast'

  const selectedBorder = isOutcast
    ? 'border-orange-400 bg-orange-400/5'
    : accentAmber
    ? 'border-amber bg-amber/5'
    : 'border-teal bg-teal/5'

  const symbolColor = selected
    ? isOutcast
      ? 'text-orange-400'
      : accentAmber
      ? 'text-amber'
      : 'text-teal'
    : 'text-text'

  const checkColor = selected
    ? isOutcast
      ? 'border-orange-400 bg-orange-400 text-bg'
      : accentAmber
      ? 'border-amber bg-amber text-bg'
      : 'border-teal bg-teal text-bg'
    : 'border-border'

  return (
    <button
      onClick={onToggle}
      className={clsx(
        'text-left p-4 rounded-xl border transition-all duration-150 group',
        selected ? selectedBorder : 'border-border bg-surface hover:border-border/60'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className={clsx('font-mono font-bold text-lg', symbolColor)}>
            {stock.symbol}
          </div>
          <div className="text-muted text-xs leading-tight">{stock.name}</div>
        </div>
        <div className={clsx('w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5', checkColor)}>
          {selected && <span className="text-xs font-bold">✓</span>}
        </div>
      </div>

      <div className="text-xs px-2 py-0.5 rounded bg-border/50 text-muted inline-block mb-2">
        {stock.sector}
      </div>

      <p className="text-muted text-xs leading-relaxed line-clamp-2">{stock.description}</p>

      <div className="mt-3 pt-3 border-t border-border/50 flex items-start gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Info size={12} className="text-muted flex-shrink-0 mt-0.5" />
        <p className="text-muted/80 text-xs leading-relaxed">{stock.outcome}</p>
      </div>
    </button>
  )
}

interface Props {
  era: EraInfo
  selected: string[]
  onToggle: (symbol: string) => void
}

export function StockPicker({ era, selected, onToggle }: Props) {
  const accentAmber = era.color === 'amber'
  const accent = accentAmber ? 'text-amber' : 'text-teal'

  const darlingCount = era.stocks.filter(s => selected.includes(s.symbol)).length
  const outcastCount = era.outcasts.filter(s => selected.includes(s.symbol)).length
  const indexCount = INDEX_STOCKS.filter(s => selected.includes(s.symbol)).length
  const totalSelected = selected.length

  return (
    <section className="max-w-6xl mx-auto px-4 pb-16">
      <div className="mb-8">
        <div className={clsx('font-mono text-sm mb-2', accent)}>STEP 02</div>
        <h2 className="text-3xl font-bold text-text">Pick Your Stocks</h2>
        <p className="text-muted mt-2">
          Hover any card to see how the story ended. Monthly investment applies to each stock independently.
        </p>
        {totalSelected > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selected.map(sym => {
              const isOutcast = era.outcasts.some(s => s.symbol === sym)
              return (
                <span
                  key={sym}
                  className={clsx(
                    'text-xs font-mono px-2 py-1 rounded-lg border',
                    isOutcast
                      ? 'border-orange-400/40 text-orange-400 bg-orange-400/10'
                      : accentAmber
                      ? 'border-amber/40 text-amber bg-amber/10'
                      : 'border-teal/40 text-teal bg-teal/10'
                  )}
                >
                  {sym}
                </span>
              )
            })}
          </div>
        )}
      </div>

      {/* Darlings */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Star size={16} className={clsx(accentAmber ? 'text-amber' : 'text-teal')} />
          <div className={clsx('font-semibold text-sm', accentAmber ? 'text-amber' : 'text-teal')}>
            The Darlings
          </div>
          <div className="text-muted text-xs">— what everyone wanted in {era.subtitle}</div>
          {darlingCount > 0 && (
            <span className={clsx('ml-auto text-xs font-mono', accentAmber ? 'text-amber' : 'text-teal')}>
              {darlingCount} selected
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {era.stocks.map((stock) => (
            <StockCard
              key={stock.symbol}
              stock={stock}
              selected={selected.includes(stock.symbol)}
              onToggle={() => onToggle(stock.symbol)}
              accentAmber={accentAmber}
              variant="darling"
            />
          ))}
        </div>
      </div>

      {/* Outcasts */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-orange-400" />
          <div className="font-semibold text-sm text-orange-400">
            The Outcasts
          </div>
          <div className="text-muted text-xs">— ignored, mocked, or written off</div>
          {outcastCount > 0 && (
            <span className="ml-auto text-xs font-mono text-orange-400">
              {outcastCount} selected
            </span>
          )}
        </div>
        <div className="p-4 rounded-xl border border-orange-400/20 bg-orange-400/5">
          <p className="text-muted/80 text-xs mb-4">
            These stocks were unpopular, controversial, or outright laughed at during this era. Hover to see how the story ended.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {era.outcasts.map((stock) => (
              <StockCard
                key={stock.symbol}
                stock={stock}
                selected={selected.includes(stock.symbol)}
                onToggle={() => onToggle(stock.symbol)}
                accentAmber={accentAmber}
                variant="outcast"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Index funds */}
      <div>
        <div className="text-muted text-xs font-mono uppercase mb-3 flex items-center gap-2">
          <span>Index Funds</span>
          <span className="text-border">—</span>
          <span>always available as benchmark</span>
          {indexCount > 0 && (
            <span className="ml-auto text-teal">{indexCount} selected</span>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {INDEX_STOCKS.map((stock) => (
            <StockCard
              key={stock.symbol}
              stock={stock}
              selected={selected.includes(stock.symbol)}
              onToggle={() => onToggle(stock.symbol)}
              accentAmber={accentAmber}
              variant="index"
            />
          ))}
        </div>
      </div>
    </section>
  )
}
