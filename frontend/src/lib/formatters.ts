export function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(2)}`
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatMultiple(value: number): string {
  return `${value.toFixed(2)}x`
}

export function formatDate(dateStr: string): string {
  const [year, month] = dateStr.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[parseInt(month) - 1]} ${year}`
}

export function isGain(value: number): boolean {
  return value >= 0
}

export function gainClass(value: number): string {
  return value >= 0 ? 'text-gain' : 'text-loss'
}
