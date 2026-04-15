export type EraId =
  | '1980-1985'
  | '1985-1990'
  | '1990-1995'
  | '1995-2000'
  | '2000-2005'
  | '2005-2010'
  | '2010-2015'
  | '2015-2020'
  | '2020-2025'

export interface StockInfo {
  symbol: string
  name: string
  sector: string
  description: string
  outcome: string
  availableFrom: string // YYYY-MM-DD
}

export interface EraInfo {
  id: EraId
  title: string
  subtitle: string
  description: string
  dateRange: { start: string; end: string }
  color: string
  stocks: StockInfo[]
  outcasts: StockInfo[]
}

export interface PricePoint {
  date: string
  price: number
}

export interface DCAConfig {
  monthlyAmount: number
  startDate: string
  endDate: string
}

export interface MonthlySnapshot {
  date: string
  price: number
  sharesBought: number
  totalShares: number
  totalInvested: number
  portfolioValue: number
}

export interface StockDCAResult {
  symbol: string
  name: string
  isOutcast: boolean
  snapshots: MonthlySnapshot[]
  firstDate: string   // actual first month of data (may be after requested start)
  totalInvested: number
  finalValue: number
  totalReturn: number
  cagr: number
  multiple: number
}

export interface CombinedSnapshot {
  date: string
  totalInvested: number
  portfolioValue: number
  [symbol: string]: number | string
}

export interface SimulationResult {
  stockResults: StockDCAResult[]
  combined: CombinedSnapshot[]
}
