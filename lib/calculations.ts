export interface Variant {
  bottles_per_case: number
  price_per_case: number
  free_bottles_per_case: number
}

export interface SchemeResult {
  free_bottles: number
  total_bottles: number
  amount: number
}

export function calculateScheme(cases: number, variant: Variant): SchemeResult {
  const free_bottles = cases * variant.free_bottles_per_case
  const total_bottles = cases * variant.bottles_per_case + free_bottles
  const amount = cases * variant.price_per_case
  return { free_bottles, total_bottles, amount }
}

export function formatQuantity(cases: number, bottles: number): string {
  if (cases > 0 && bottles > 0) return `${cases} Case ${bottles} Bottle`
  if (cases > 0) return `${cases} Case`
  return `${bottles} Bottle`
}

export interface OrderSummary {
  total_paid_cases: number
  total_amount: number
}

export function aggregateOrderSummary(items: { cases: number; amount: number }[]): OrderSummary {
  return {
    total_paid_cases: items.reduce((sum, i) => sum + i.cases, 0),
    total_amount: items.reduce((sum, i) => sum + Number(i.amount), 0),
  }
}
