import type { PricePoint } from '../types'

const BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'

export async function fetchPricesBulk(
  symbols: string[],
  start: string,
  end: string
): Promise<Record<string, PricePoint[]>> {
  const params = new URLSearchParams({
    symbols: symbols.join(','),
    start,
    end,
  })

  const res = await fetch(`${BASE}/prices-bulk?${params}`)
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail ?? `HTTP ${res.status}`)
  }

  return res.json()
}


export async function submitFeedback(
  message: string,
  email?: string
): Promise<{ok: boolean}> {

  const res = await fetch(`${BASE}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({message, email})
    })
  if (!res.ok) {
    const error = await res.json().catch(() => ({detail: "Failed to submit feedback"}))
    throw new Error(error.detail ?? `HTTP ${res.status}`)
  }
  return res.json()
}
