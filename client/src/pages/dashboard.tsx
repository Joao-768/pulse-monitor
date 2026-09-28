import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useAuth } from '@/auth/auth-context'
import { CreateMonitorDialog } from '@/components/monitor-dialogs'
import { ResponseSparkline } from '@/components/response-chart'
import { StatusDot, TimelineStrip } from '@/components/status'
import { useToast } from '@/components/toast'
import { Alert, Button, Skeleton } from '@/components/ui'
import { useApi } from '@/hooks/use-api'
import { useNow } from '@/hooks/use-now'
import { formatDuration, formatMs, formatPercent, formatRelative, hostOf } from '@/lib/format'
import type { Dashboard, DashboardMonitor, MonitorStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

// Problems first, then everything else by name.
const ORDER: Record<MonitorStatus, number> = { DOWN: 0, PENDING: 1, UP: 2, PAUSED: 3 }

function sortMonitors(monitors: DashboardMonitor[]) {
    return [...monitors].sort(
        (a, b) => ORDER[a.status] - ORDER[b.status] || a.name.localeCompare(b.name),
    )
}

function Figure({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
    return (
        <div className="min-w-0 px-4 py-3 sm:px-5 sm:py-4">
            <div className="eyebrow">{label}</div>
            <div
                className={cn(
                    'mt-1 font-mono text-xl font-medium tracking-tight sm:text-2xl',
                    tone,
                )}
            >
                {value}
            </div>
        </div>
    )
}

function Summary({ summary }: { summary: Dashboard['summary'] }) {
    return (
        // gap-px over a rule-coloured background draws the dividers at every width.
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-rule bg-rule sm:grid-cols-3 lg:grid-cols-6 [&>*]:bg-surface">
            <Figure label="Up" value={summary.up} tone={summary.up ? 'text-up' : 'text-ink-3'} />
            <Figure
                label="Down"
                value={summary.down}
                tone={summary.down ? 'text-down' : 'text-ink-3'}
            />
            <Figure
                label="Checking"
                value={summary.pending}
                tone={summary.pending ? 'text-pending' : 'text-ink-3'}
            />
            <Figure label="Paused" value={summary.paused} tone="text-ink-3" />
            <Figure label="Uptime · 24h" value={formatPercent(summary.uptime24h)} />
            <Figure label="Incidents · 24h" value={summary.incidents24h} />
        </div>
    )
}

function StatusLine({ monitor }: { monitor: DashboardMonitor }) {
    const now = useNow()
    if (monitor.status === 'DOWN' && monitor.activeIncident) {
        return (
            <p className="truncate text-[13px] text-down">
                Down for{' '}
                {formatDuration(now - new Date(monitor.activeIncident.startedAt).getTime())}
                <span className="text-ink-3"> · </span>
                {monitor.activeIncident.reason}
            </p>
        )
    }
    if (monitor.status === 'PAUSED') {
        return (
            <p className="truncate text-[13px] text-ink-3">
                Paused {formatRelative(monitor.pausedAt)} · not checked while paused
            </p>
        )
    }
    if (monitor.status === 'PENDING') {
        return (
            <p className="truncate text-[13px] text-pending">
                {monitor.retryPending
                    ? 'Last check failed, retrying to confirm'
                    : 'Running the first check'}
            </p>
        )
    }
    if (monitor.retryPending) {
        return (
            <p className="truncate text-[13px] text-pending">
                Last check failed, retrying to confirm
            </p>
        )
    }
    return <p className="truncate font-mono text-[12px] text-ink-3">{hostOf(monitor.url)}</p>
}

function MonitorRow({ monitor }: { monitor: DashboardMonitor }) {
    const paused = monitor.status === 'PAUSED'
    return (
        <li>
            <Link
                to={`/app/monitors/${monitor.id}`}
                className={cn(
                    'grid gap-x-6 gap-y-3 px-4 py-4 transition-colors hover:bg-paper/70 sm:px-5',
                    'grid-cols-[1fr_auto] lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1.3fr)_8.5rem_6rem_7rem] lg:items-center',
                    monitor.status === 'DOWN' && 'bg-down-soft/40 hover:bg-down-soft/60',
                )}
            >
                <div className="flex min-w-0 items-start gap-3">
                    <StatusDot status={monitor.status} className="mt-[5px]" />
                    <div className="min-w-0">
                        <p className="truncate text-[15px] font-medium">{monitor.name}</p>
                        <StatusLine monitor={monitor} />
                    </div>
                </div>

                <div className="text-right lg:hidden">
                    <div className="font-mono text-sm">{formatPercent(monitor.uptime24h)}</div>
                    <div className="text-[12px] text-ink-3">
                        {formatRelative(monitor.lastCheckedAt)}
                    </div>
                </div>

                <div className={cn('col-span-2 lg:col-span-1', paused && 'opacity-60')}>
                    <TimelineStrip buckets={monitor.timeline} height={22} />
                    <div className="mt-1 flex justify-between font-mono text-[10px] text-ink-3">
                        <span>24h ago</span>
                        <span>now</span>
                    </div>
                </div>

                <div className={cn('hidden items-center gap-2 lg:flex', paused && 'opacity-60')}>
                    <div className="h-7 w-16">
                        <ResponseSparkline points={monitor.responseTime} />
                    </div>
                    <span className="font-mono text-[13px] whitespace-nowrap text-ink-2">
                        {formatMs(monitor.avgResponseTime24h)}
                    </span>
                </div>

                <div className="hidden text-right lg:block">
                    <div className="font-mono text-sm">{formatPercent(monitor.uptime24h)}</div>
                    <div className="text-[11px] text-ink-3">uptime</div>
                </div>

                <div className="hidden text-right lg:block">
                    <div className="text-[13px]">{formatRelative(monitor.lastCheckedAt)}</div>
                    <div
                        className={cn(
                            'font-mono text-[11px]',
                            monitor.lastCheck?.status === 'FAILURE' ? 'text-down' : 'text-ink-3',
                        )}
                    >
                        {monitor.lastCheck
                            ? (monitor.lastCheck.statusCode ??
                              monitor.lastCheck.errorType?.replace(/_/g, ' ').toLowerCase())
                            : 'no checks yet'}
                    </div>
                </div>
            </Link>
        </li>
    )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
    return (
        <div className="graph-paper rounded-lg border border-rule px-6 py-16 text-center">
            <svg
                viewBox="0 0 220 40"
                className="mx-auto mb-6 h-10 w-56 text-rule-strong"
                aria-hidden="true"
            >
                <path
                    d="M0 20h220"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="4 6"
                    fill="none"
                />
            </svg>
            <h2 className="text-xl font-semibold tracking-[-0.01em]">
                Nothing is being watched yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">
                Add the first website or API endpoint. Pulse Monitor checks it right away and then
                on a schedule, whether or not this page is open.
            </p>
            <Button className="mt-6" onClick={onAdd}>
                <Plus size={16} aria-hidden="true" /> Add your first monitor
            </Button>
        </div>
    )
}

export function DashboardPage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const toast = useToast()
    const [creating, setCreating] = useState(false)
    const { data, error, loading, reload } = useApi<Dashboard>('/dashboard', { pollMs: 15_000 })

    const monitors = data ? sortMonitors(data.monitors) : []

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="eyebrow">Last 24 hours</p>
                    <h1 className="mt-1 text-[28px] font-semibold tracking-[-0.025em]">Monitors</h1>
                </div>
                {data && data.monitors.length > 0 ? (
                    <Button onClick={() => setCreating(true)}>
                        <Plus size={16} aria-hidden="true" /> Add monitor
                    </Button>
                ) : null}
            </div>

            {error && !data ? <Alert>{error.message}</Alert> : null}

            {loading && !data ? (
                <div className="space-y-3">
                    <Skeleton className="h-20" />
                    <Skeleton className="h-64" />
                </div>
            ) : null}

            {data ? (
                data.monitors.length === 0 ? (
                    <EmptyState onAdd={() => setCreating(true)} />
                ) : (
                    <>
                        <Summary summary={data.summary} />
                        <section className="overflow-hidden rounded-lg border border-rule bg-surface">
                            <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1.3fr)_8.5rem_6rem_7rem] gap-x-6 border-b border-rule px-5 py-2.5 lg:grid">
                                <span className="eyebrow">Monitor</span>
                                <span className="eyebrow">Availability, hourly</span>
                                <span className="eyebrow">Response, avg</span>
                                <span className="eyebrow text-right">Uptime</span>
                                <span className="eyebrow text-right">Last check</span>
                            </div>
                            <ul className="divide-y divide-rule">
                                {monitors.map((monitor) => (
                                    <MonitorRow key={monitor.id} monitor={monitor} />
                                ))}
                            </ul>
                        </section>
                        <p className="text-[12px] text-ink-3">
                            {data.monitors.length} of {user?.plan.maxMonitors} monitors on the{' '}
                            {user?.plan.name} plan. Updates every 15 seconds.
                        </p>
                    </>
                )
            ) : null}

            {user ? (
                <CreateMonitorDialog
                    open={creating}
                    onClose={() => setCreating(false)}
                    plan={user.plan}
                    used={data?.monitors.length ?? 0}
                    onCreated={(monitor) => {
                        toast(`${monitor.name} added. Running the first check.`)
                        reload()
                        navigate(`/app/monitors/${monitor.id}`)
                    }}
                />
            ) : null}
        </div>
    )
}
