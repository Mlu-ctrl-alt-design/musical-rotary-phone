const KEY = 'docbrowser:settings'

export interface AppSettings {
  baseUrl: string
  apiKey: string
  apiSecret: string
}

const DEFAULTS: AppSettings = { baseUrl: '', apiKey: '', apiSecret: '' }

export function getSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(KEY)
    if (!stored) return { ...DEFAULTS }
    return { ...DEFAULTS, ...JSON.parse(stored) }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveSettings(s: AppSettings): void {
  localStorage.setItem(KEY, JSON.stringify(s))
}

export function clearSettings(): void {
  localStorage.removeItem(KEY)
}
