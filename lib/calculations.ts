export interface Variant {
  bottles_per_case: number
  price_per_case: number
  free_bottles_per_case: number
}

export interface SchemeResult {
  paid_cases: number
  paid_bottles: number
  free_bottles: number
  total_bottles: number
  total_cases: number
  remaining_bottles: number
  amount: number
}

export function calculateScheme(cases: number, variant: Variant): SchemeResult {
  const paid_bottles = cases * variant.bottles_per_case
  const free_bottles = cases * variant.free_bottles_per_case
  const total_bottles = paid_bottles + free_bottles
  const total_cases = Math.floor(total_bottles / variant.bottles_per_case)
  const remaining_bottles = total_bottles % variant.bottles_per_case
  const amount = cases * variant.price_per_case

  return {
    paid_cases: cases,
    paid_bottles,
    free_bottles,
    total_bottles,
    total_cases,
    remaining_bottles,
    amount,
  }
}

export function formatQuantity(cases: number, bottles: number): string {
  if (cases > 0 && bottles > 0) return `${cases} Case ${bottles} Bottle`
  if (cases > 0) return `${cases} Case`
  return `${bottles} Bottle`
}

export interface OrderItemForAggregation {
  cases: number
  free_bottles: number
  total_bottles: number
  amount: number
  bottles_per_case: number
}

export interface OrderSummary {
  total_paid_cases: number
  total_free_bottles: number
  scheme_display: string
  grand_total_bottles: number
  grand_display: string
  total_amount: number
}

export function aggregateOrderSummary(items: OrderItemForAggregation[]): OrderSummary {
  const total_paid_cases = items.reduce((sum, i) => sum + i.cases, 0)
  const total_free_bottles = items.reduce((sum, i) => sum + i.free_bottles, 0)
  const total_amount = items.reduce((sum, i) => sum + i.amount, 0)

  // For grand total, sum all total_bottles but we need a common bottles_per_case
  // Since products can have different bottles_per_case, we show scheme as total free bottles only
  // and grand total as paid cases + free bottles in a combined display
  const total_grand_bottles = items.reduce((sum, i) => sum + i.total_bottles, 0)

  // Scheme display: show total free bottles
  // We convert using the most common bottles_per_case (24) for display
  const defaultBpc = 24
  const schemeCases = Math.floor(total_free_bottles / defaultBpc)
  const schemeBottles = total_free_bottles % defaultBpc
  const scheme_display = total_free_bottles === 0
    ? 'No scheme'
    : formatQuantity(schemeCases, schemeBottles)

  // Grand total display
  const grandCases = Math.floor(total_grand_bottles / defaultBpc)
  const grandBottles = total_grand_bottles % defaultBpc
  const grand_display = formatQuantity(grandCases, grandBottles)

  return {
    total_paid_cases,
    total_free_bottles,
    scheme_display,
    grand_total_bottles: total_grand_bottles,
    grand_display,
    total_amount,
  }
}
