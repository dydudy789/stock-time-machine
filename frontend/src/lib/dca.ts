import type {
  PricePoint,
  MonthlySnapshot,
  StockDCAResult,
  CombinedSnapshot,
  SimulationResult,
  DCAConfig,
} from '../types'

function calcCAGR(startValue: number, endValue: number, months: number): number {
  if (months <= 0 || startValue <= 0) return 0
  const years = months / 12
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100
}

export function calculateDCA(
  prices: PricePoint[],
  config: DCAConfig
): { snapshots: MonthlySnapshot[]; totalInvested: number; finalValue: number } {
  const startMonth = config.startDate.slice(0, 7)
  const endMonth = config.endDate.slice(0, 7)
  const filtered = prices.filter((p) => {
    const m = p.date.slice(0, 7)
    return m >= startMonth && m <= endMonth
  })

  if (filtered.length === 0) {
    return { snapshots: [], totalInvested: 0, finalValue: 0 }
  }

  let totalShares = 0
  let totalInvested = 0
  const snapshots: MonthlySnapshot[] = []

  for (const { date, price } of filtered) {
    if (price <= 0) continue
    const sharesBought = config.monthlyAmount / price
    totalShares += sharesBought
    totalInvested += config.monthlyAmount

    snapshots.push({
      date,
      price,
      sharesBought,
      totalShares,
      totalInvested,
      portfolioValue: totalShares * price,
    })
  }

  const finalValue = snapshots.at(-1)?.portfolioValue ?? 0
  return { snapshots, totalInvested, finalValue }
}

export function runSimulation(
  priceMap: Record<string, PricePoint[]>,
  stockNames: Record<string, string>,
  outcastSymbols: Set<string>,
  config: DCAConfig
): SimulationResult {
  const stockResults: StockDCAResult[] = []

  for (const [symbol, prices] of Object.entries(priceMap)) {
    const { snapshots, totalInvested, finalValue } = calculateDCA(prices, config)

    if (snapshots.length === 0) continue

    const totalReturn = totalInvested > 0 ? ((finalValue - totalInvested) / totalInvested) * 100 : 0
    const cagr = calcCAGR(totalInvested, finalValue, snapshots.length)
    const multiple = totalInvested > 0 ? finalValue / totalInvested : 0

    stockResults.push({
      symbol,
      name: stockNames[symbol] ?? symbol,
      isOutcast: outcastSymbols.has(symbol),
      snapshots,
      firstDate: snapshots[0].date,
      totalInvested,
      finalValue,
      totalReturn,
      cagr,
      multiple,
    })
  }

  // Build combined timeline
  const allDates = new Set<string>()
  for (const r of stockResults) {
    for (const s of r.snapshots) allDates.add(s.date)
  }

  const sortedDates = Array.from(allDates).sort()
  const latestByStock: Record<string, MonthlySnapshot> = {}

  const combined: CombinedSnapshot[] = sortedDates.map((date) => {
    for (const r of stockResults) {
      const snap = r.snapshots.find((s) => s.date === date)
      if (snap) latestByStock[r.symbol] = snap
    }

    let totalInvested = 0
    let portfolioValue = 0
    const row: CombinedSnapshot = { date, totalInvested: 0, portfolioValue: 0 }

    for (const r of stockResults) {
      const snap = latestByStock[r.symbol]
      if (snap) {
        totalInvested += snap.totalInvested
        portfolioValue += snap.portfolioValue
        row[r.symbol] = Math.round(snap.portfolioValue * 100) / 100
      }
    }

    row.totalInvested = Math.round(totalInvested * 100) / 100
    row.portfolioValue = Math.round(portfolioValue * 100) / 100
    return row
  })

  return { stockResults, combined }
}
