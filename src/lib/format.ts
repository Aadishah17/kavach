const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export function formatCurrency(value: number) {
  return inrFormatter.format(value)
}

export function formatSignedCurrency(value: number) {
  if (value < 0) {
    return `-${formatCurrency(Math.abs(value))}`
  }

  return formatCurrency(value)
}

export function formatCompactINR(value: number) {
  if (value >= 10000000) {
    return `${formatCurrency(value / 10000000).replace('.0', '')}Cr`
  }

  if (value >= 100000) {
    return `${formatCurrency(value / 100000).replace('.0', '')}L`
  }

  return formatCurrency(value)
}

export function formatLakhs(value: number) {
  return `₹${value.toFixed(1)}L`
}
