const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const preciseInrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatCurrency(value: number, precise = false) {
  return precise ? preciseInrFormatter.format(value) : inrFormatter.format(value)
}

export function formatSignedCurrency(value: number) {
  if (value < 0) {
    return `-${formatCurrency(Math.abs(value))}`
  }

  return formatCurrency(value)
}

export function formatCompactINR(value: number) {
  if (value >= 10000000) {
    return `₹${new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 10000000)}Cr`
  }

  if (value >= 100000) {
    return `₹${new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100000)}L`
  }

  return formatCurrency(value)
}

export function formatCompactCurrency(value: number) {
  return formatCompactINR(value)
}

export function formatLakhs(value: number) {
  return `₹${value.toFixed(1)}L`
}

export function formatPercent(value: number, digits = 1) {
  return `${value.toFixed(digits)}%`
}
