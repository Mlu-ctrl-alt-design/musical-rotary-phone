import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp('(^| )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]+)')
  )
  return match ? decodeURIComponent(match[2]) : null
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return ''
  try {
    const date = new Date(value)
    if (isNaN(date.getTime())) return value
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return value
  }
}

export function formatDatetime(value: string | null | undefined): string {
  if (!value) return ''
  try {
    const date = new Date(value)
    if (isNaN(date.getTime())) return value
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return ''
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return String(value)
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }
}
