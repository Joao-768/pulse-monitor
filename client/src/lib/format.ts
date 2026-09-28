const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

// "2h 14m", "45s", "3d 4h"
export function formatDuration(ms: number): string {
    const seconds = Math.max(0, Math.round(ms / 1000))
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const rest = seconds % 60
    if (days > 0) return hours ? `${days}d ${hours}h` : `${days}d`
    if (hours > 0) return minutes ? `${hours}h ${minutes}m` : `${hours}h`
    if (minutes > 0) return rest && minutes < 10 ? `${minutes}m ${rest}s` : `${minutes}m`
    return `${rest}s`
}

// "just now", "3 min ago", "2 h ago", "4 days ago"
export function formatRelative(value: string | Date | null, now = Date.now()): string {
    if (!value) return 'never'
    const diff = now - new Date(value).getTime()
    if (diff < 10_000) return 'just now'
    if (diff < MINUTE) return `${Math.round(diff / 1000)}s ago`
    if (diff < HOUR) return `${Math.round(diff / MINUTE)} min ago`
    if (diff < DAY) return `${Math.round(diff / HOUR)} h ago`
    const days = Math.round(diff / DAY)
    return days === 1 ? 'yesterday' : `${days} days ago`
}

const dateTime = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
})
const dateTimeShort = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
})
const timeOnly = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })

export function formatDateTime(value: string | Date, withSeconds = true): string {
    return (withSeconds ? dateTime : dateTimeShort).format(new Date(value))
}

export function formatTime(value: string | Date): string {
    return timeOnly.format(new Date(value))
}

// Uptime needs precision near 100%: 99.95% and 100% are very different.
export function formatPercent(value: number | null | undefined): string {
    if (value === null || value === undefined) return '–'
    if (value >= 100) return '100%'
    if (value >= 99.99) return `${value.toFixed(3)}%`
    return `${value.toFixed(2)}%`
}

export function formatMs(value: number | null | undefined): string {
    if (value === null || value === undefined) return '–'
    if (value >= 10_000) return `${(value / 1000).toFixed(1)} s`
    return `${Math.round(value)} ms`
}

export function formatInterval(seconds: number): string {
    if (seconds < 60) return `${seconds} seconds`
    const minutes = seconds / 60
    return minutes === 1 ? '1 minute' : `${minutes} minutes`
}

export function formatRetention(days: number): string {
    if (days === 365) return '1 year'
    return `${days} days`
}

export function hostOf(url: string): string {
    try {
        const parsed = new URL(url)
        return parsed.host + (parsed.pathname === '/' ? '' : parsed.pathname)
    } catch {
        return url
    }
}
