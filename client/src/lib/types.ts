export type MonitorStatus = 'PENDING' | 'UP' | 'DOWN' | 'PAUSED'
export type TimelineState = 'none' | 'paused' | 'up' | 'partial' | 'down'
export type PeriodKey = '24h' | '7d' | '30d' | 'all'

export interface Plan {
    key: 'FREE' | 'PRO' | 'BUSINESS'
    name: string
    maxMonitors: number
    checkIntervalSeconds: number
    retentionDays: number
    available?: boolean
}

export interface User {
    id: string
    email: string
    plan: Plan
    createdAt: string
}

export interface Monitor {
    id: string
    name: string
    url: string
    status: MonitorStatus
    createdAt: string
    pausedAt: string | null
    lastCheckedAt: string | null
    retryPending: boolean
}

export interface Check {
    id: string
    status: 'SUCCESS' | 'FAILURE'
    statusCode: number | null
    responseTime: number | null
    errorType: string | null
    errorMessage: string | null
    isRetry: boolean
    checkedAt: string
}

export interface Incident {
    id: string
    monitorId: string
    monitorName?: string
    monitorUrl?: string
    startedAt: string
    resolvedAt: string | null
    resolution: 'RECOVERED' | 'PAUSED' | null
    reason: string
    durationMs: number
    active: boolean
}

export interface TimelineBucket {
    from: string
    to?: string
    state: TimelineState
    uptimePercent: number | null
}

export interface DashboardMonitor extends Monitor {
    uptime24h: number | null
    downtime24hMs: number
    avgResponseTime24h: number | null
    checks24h: number
    timeline: TimelineBucket[]
    responseTime: { at: string; avg: number }[]
    lastCheck: Check | null
    activeIncident: Incident | null
}

export interface Dashboard {
    summary: {
        total: number
        up: number
        down: number
        paused: number
        pending: number
        uptime24h: number | null
        incidents24h: number
    }
    monitors: DashboardMonitor[]
}

export interface MonitorDetail {
    monitor: Monitor
    lastCheck: Check | null
    activeIncident: Incident | null
}

export interface MonitorMetrics {
    period: {
        key: PeriodKey
        from: string
        to: string
        dataFrom: string
        limitedByRetention: boolean
        retentionDays: number
        bucketSeconds: number
    }
    availability: {
        monitoredMs: number
        pausedMs: number
        downtimeMs: number
        uptimeMs: number
        uptimePercent: number | null
    }
    checks: {
        total: number
        failures: number
        retries: number
        avgResponseTime: number | null
        p95ResponseTime: number | null
        minResponseTime: number | null
        maxResponseTime: number | null
    }
    incidentCount: number
    responseTime: {
        at: string
        avg: number | null
        max: number | null
        checks: number
        failures: number
    }[]
    timeline: TimelineBucket[]
    topErrors: { errorType: string; message: string; occurrences: number; lastSeen: string }[]
}

export interface Page<T> {
    items: T[]
    page: number
    pageSize: number
    total: number
}

export interface Notification {
    id: string
    type: 'INCIDENT' | 'RECOVERY'
    message: string
    isRead: boolean
    createdAt: string
    monitorId: string | null
    monitorName: string | null
}
