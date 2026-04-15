import { TrendingUp, Zap, Shield, Flame, Globe, BarChart2, Rocket, Cpu, Bot } from 'lucide-react'
import clsx from 'clsx'
import { ERAS } from '../data/eras'
import type { EraId } from '../types'

const ERA_ICONS: Record<EraId, React.ElementType> = {
  '1980-1985': Shield,
  '1985-1990': Flame,
  '1990-1995': Globe,
  '1995-2000': Zap,
  '2000-2005': TrendingUp,
  '2005-2010': BarChart2,
  '2010-2015': Rocket,
  '2015-2020': Cpu,
  '2020-2025': Bot,
}

interface Props {
  selected: EraId | null
  onSelect: (era: EraId) => void
}

export function EraSelector({ selected, onSelect }: Props) {
  return (
    <section className="max-w-6xl mx-auto px-4 py-16">
      <div className="mb-10">
        <div className="text-teal font-mono text-sm mb-2">STEP 01</div>
        <h2 className="text-3xl font-bold text-text">Choose Your Era</h2>
        <p className="text-muted mt-2">
          Each era had its own mood, its own darlings, and its own painful lessons.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {ERAS.map((era) => {
          const Icon = ERA_ICONS[era.id]
          const isSelected = selected === era.id
          const isAmber = era.color === 'amber'

          return (
            <button
              key={era.id}
              onClick={() => onSelect(era.id)}
              className={clsx(
                'text-left p-5 rounded-2xl border transition-all duration-200',
                isSelected
                  ? isAmber
                    ? 'border-amber bg-amber/5 shadow-lg shadow-amber/10'
                    : 'border-teal bg-teal/5 shadow-lg shadow-teal/10'
                  : 'border-border bg-surface hover:border-border/80'
              )}
            >
              <div
                className={clsx(
                  'w-9 h-9 rounded-lg flex items-center justify-center mb-3',
                  isSelected
                    ? isAmber
                      ? 'bg-amber/20 text-amber'
                      : 'bg-teal/20 text-teal'
                    : 'bg-border text-muted'
                )}
              >
                <Icon size={18} />
              </div>

              <div
                className={clsx(
                  'font-mono text-xs mb-1',
                  isSelected ? (isAmber ? 'text-amber' : 'text-teal') : 'text-muted'
                )}
              >
                {era.subtitle}
              </div>

              <h3 className="text-text font-bold text-sm mb-2 leading-snug">{era.title}</h3>

              <div className="flex items-center gap-2 mt-3">
                <span className={clsx('text-xs font-mono', isSelected ? (isAmber ? 'text-amber/70' : 'text-teal/70') : 'text-muted')}>
                  {era.stocks.length} darlings · {era.outcasts.length} outcasts
                </span>
                {isSelected && (
                  <span
                    className={clsx(
                      'ml-auto text-xs px-2 py-0.5 rounded-full font-mono flex-shrink-0',
                      isAmber ? 'bg-amber/20 text-amber' : 'bg-teal/20 text-teal'
                    )}
                  >
                    ✓
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Description panel for selected era */}
      {selected && (() => {
        const era = ERAS.find(e => e.id === selected)
        if (!era) return null
        const isAmber = era.color === 'amber'
        return (
          <div className={clsx(
            'mt-6 p-5 rounded-2xl border',
            isAmber ? 'border-amber/20 bg-amber/5' : 'border-teal/20 bg-teal/5'
          )}>
            <p className="text-muted text-sm leading-relaxed">{era.description}</p>
          </div>
        )
      })()}
    </section>
  )
}
