export function readStoredJSON<T>(key: string, fallback: T): T {
  if (import.meta.server) return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  } catch {
    return fallback
  }
}

export function writeStoredJSON(key: string, value: unknown) {
  if (import.meta.client) {
    localStorage.setItem(key, JSON.stringify(value))
  }
}
