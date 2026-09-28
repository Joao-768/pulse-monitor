import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Download, ExternalLink, Pause, Pencil, Play, Trash2 } from 'lucide-react'
import { useAuth } from '@/auth/auth-context'
import { DeleteMonitorDialog, RenameMonitorDialog } from '@/components/monitor-dialogs'
import { ResponseTimeChart } from '@/components/response-chart'
import { StatusBadge, TimelineStrip } from '@/components/status'
import { useToast } from '@/components/toast'
import { buttonClass } from '@/components/button-class'
import { Alert, Button, Panel, PanelHeader, Skeleton } from '@/components/ui'
import { useApi } from '@/hooks/use-api'
import { useNow } from '@/hooks/use-now'
import { ApiError, api } from '@/lib/api'
import {
    formatDateTime,
    formatDuration,
    formatInterval,
    formatMs,
    formatPercent,
    formatRelative,
    formatRetention,
} from '@/lib/format'
import type {
    Check,
    Incident,
    Monitor,
    MonitorDetail,
    MonitorMetrics,
    Page,
    PeriodKey,
} from '@/lib/types'
import { cn } from '@/lib/utils'

const PERIODS: { key: PeriodKey; label: string }[] = [
    { key: '24h', label: '24h' },
    { key: '7d', label: '7d' },
    { key: '30d', label: '30d' },
    { key: 'all', label: 'All' },
]

function PeriodPicker({
    value,
    onChange,
}: {
    value: PeriodKey
    onChange: (key: PeriodKey) => void
}) {
    return (
        <div
            role="radiogroup"
            aria-label="Period"
            className="inline-flex rounded-md border border-rule-strong bg-surface p-0.5"
        >
            {PERIODS.map((period) => (
                <button
                    key={period.key}
                    role="radio"
                    aria-checked={value === period.key}
                    onClick={() => onChange(period.key)}
                    className={cn(
                        'h-8 min-w-12 rounded px-3 font-mono text-[13px] transition-colors',
                        value === period.key
                            ? 'bg-primary text-primary-fg'
                            : 'text-ink-2 hover:bg-paper',
                    )}
                >
                    {period.label}
                </button>
            ))}
        </div>
    )
}

function Stat({
    label,
    value,
    detail,
    tone,
}: {
    label: string
    value: string
    detail?: string
    tone?: string
}) {
    return (
        <div className="bg-surface px-4 py-4 sm:px-5">
            <div className="eyebrow">{label}</div>
            <div className={cn('mt-1.5 font-mono text-[22px] font-medium tracking-tight', tone)}>
                {value}
            </div>
            {detail ? <div className="mt-0.5 text-[12px] text-ink-3">{detail}</div> : null}
        </div>
    )
}

function StateBanner({ detail }: { detail: MonitorDetail }) {
    const now = useNow()
    const { monitor, activeIncident, lastCheck } = detail
    if (monitor.status === 'DOWN' && activeIncident) {
        return (
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-lg border border-down/30 bg-down-soft px-4 py-3 text-down-text">
                <strong className="font-semibold">
                    Down for {formatDuration(now - new Date(activeIncident.startedAt).getTime())}
                </strong>
                <span className="text-sm">
                    since {formatDateTime(activeIncident.startedAt, false)} ·{' '}
                    {activeIncident.reason}
                </span>
                {lastCheck &&
                lastCheck.errorMessage !== activeIncident.reason &&
                lastCheck.status === 'FAILURE' ? (
                    <span className="text-sm">Now: {lastCheck.errorMessage}</span>
                ) : null}
            </div>
        )
    }
    if (monitor.status === 'PAUSED') {
        return (
            <div className="rounded-lg border border-rule-strong bg-paused-soft px-4 py-3 text-sm text-ink-2">
                <strong className="font-semibold text-ink">
                    Paused {formatRelative(monitor.pausedAt)}.
                </strong>{' '}
                No checks run while paused, and paused time counts as neither uptime nor downtime.
                The history below is kept.
            </div>
        )
    }
    if (monitor.status === 'PENDING' || monitor.retryPending) {
        return (
            <div className="rounded-lg border border-pending/30 bg-pending-soft px-4 py-3 text-sm text-pending-text">
                {monitor.retryPending
                    ? 'The last check failed. A retry runs in a few seconds before this is treated as downtime.'
                    : 'Running a check now. The status updates as soon as it answers.'}
            </div>
        )
    }
    return null
}

function incidentLabel(incident: Incident) {
    if (incident.active) return { text: 'Ongoing', className: 'bg-down text-white' }
    if (incident.resolution === 'PAUSED')
        return { text: 'Ended by pause', className: 'bg-paused-soft text-ink-2' }
    return { text: 'Resolved', className: 'bg-up-soft text-up-text' }
}

function IncidentList({ incidents }: { incidents: Incident[] }) {
    if (incidents.length === 0) {
        return (
            <p className="px-5 py-8 text-center text-sm text-ink-3">No incidents in this period.</p>
        )
    }
    return (
        <ol className="divide-y divide-rule">
            {incidents.map((incident) => {
                const label = incidentLabel(incident)
                return (
                    <li
                        key={incident.id}
                        className="grid grid-cols-[auto_1fr_auto] items-start gap-x-4 px-5 py-3.5"
                    >
                        <span
                            className={cn(
                                'mt-0.5 w-1 self-stretch rounded-full',
                                incident.active ? 'bg-down' : 'bg-rule-strong',
                            )}
                            aria-hidden="true"
                        />
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{incident.reason}</p>
                            <p className="mt-0.5 font-mono text-[12px] text-ink-3">
                                {formatDateTime(incident.startedAt, false)} →{' '}
                                {incident.resolvedAt
                                    ? formatDateTime(incident.resolvedAt, false)
                                    : 'now'}
                            </p>
                        </div>
                        <div className="text-right">
                            <span
                                className={cn(
                                    'rounded-full px-2 py-0.5 font-mono text-[10px] tracking-wide uppercase',
                                    label.className,
                                )}
                            >
                                {label.text}
                            </span>
                            <p className="mt-1 font-mono text-[13px]">
                                {formatDuration(incident.durationMs)}
                            </p>
                        </div>
                    </li>
                )
            })}
        </ol>
    )
}

const CHECK_FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'failures', label: 'Failures' },
    { key: 'retries', label: 'Retries' },
] as const

function ChecksTable({ monitorId, period }: { monitorId: string; period: PeriodKey }) {
    const [filter, setFilter] = useState<(typeof CHECK_FILTERS)[number]['key']>('all')
    const [page, setPage] = useState(1)
    const { data, error, loading } = useApi<Page<Check>>(
        `/monitors/${monitorId}/checks?period=${period}&filter=${filter}&page=${page}`,
        { pollMs: 30_000 },
    )
    const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1

    return (
        <Panel>
            <PanelHeader
                title="Check history"
                description={
                    data
                        ? `${data.total.toLocaleString('en-US')} checks in this period`
                        : 'Every request, newest first'
                }
                actions={
                    <div className="inline-flex rounded-md border border-rule-strong p-0.5">
                        {CHECK_FILTERS.map((item) => (
                            <button
                                key={item.key}
                                onClick={() => {
                                    setFilter(item.key)
                                    setPage(1)
                                }}
                                aria-pressed={filter === item.key}
                                className={cn(
                                    'h-7 rounded px-2.5 text-[12px] font-medium',
                                    filter === item.key
                                        ? 'bg-primary text-primary-fg'
                                        : 'text-ink-2 hover:bg-paper',
                                )}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                }
            />
            {error ? (
                <div className="p-5">
                    <Alert>{error.message}</Alert>
                </div>
            ) : null}
            <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                        <tr className="border-b border-rule">
                            {['Time', 'Result', 'Status', 'Response', 'Error'].map((heading) => (
                                <th key={heading} className="eyebrow px-5 py-2.5 font-medium">
                                    {heading}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className={cn('divide-y divide-rule', loading && 'opacity-60')}>
                        {data?.items.map((check) => (
                            <tr
                                key={check.id}
                                className={
                                    check.status === 'FAILURE' ? 'bg-down-soft/35' : undefined
                                }
                            >
                                <td className="px-5 py-2.5 font-mono text-[12.5px] whitespace-nowrap text-ink-2">
                                    {formatDateTime(check.checkedAt)}
                                </td>
                                <td className="px-5 py-2.5 whitespace-nowrap">
                                    <span
                                        className={cn(
                                            'inline-flex items-center gap-1.5 text-[13px]',
                                            check.status === 'SUCCESS' ? 'text-up' : 'text-down',
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'h-1.5 w-1.5 rounded-full',
                                                check.status === 'SUCCESS' ? 'bg-up' : 'bg-down',
                                            )}
                                        />
                                        {check.status === 'SUCCESS' ? 'Success' : 'Failure'}
                                    </span>
                                    {check.isRetry ? (
                                        <span className="ml-2 rounded border border-pending/40 bg-pending-soft px-1.5 py-px font-mono text-[10px] text-pending-text uppercase">
                                            Retry
                                        </span>
                                    ) : null}
                                </td>
                                <td className="px-5 py-2.5 font-mono text-[13px]">
                                    {check.statusCode ?? '–'}
                                </td>
                                <td className="px-5 py-2.5 font-mono text-[13px]">
                                    {formatMs(check.responseTime)}
                                </td>
                                <td
                                    className="max-w-[20rem] truncate px-5 py-2.5 text-[13px] text-ink-2"
                                    title={check.errorMessage ?? undefined}
                                >
                                    {check.errorMessage ?? ''}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {data && data.items.length === 0 ? (
                    <p className="px-5 py-8 text-center text-sm text-ink-3">
                        {filter === 'all'
                            ? 'No checks in this period yet.'
                            : `No ${filter} in this period.`}
                    </p>
                ) : null}
            </div>
            {data && pages > 1 ? (
                <footer className="flex items-center justify-between border-t border-rule px-5 py-3 text-[13px] text-ink-2">
                    <span className="font-mono">
                        Page {page} of {pages.toLocaleString('en-US')}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="secondary"
                            disabled={page <= 1}
                            onClick={() => setPage(page - 1)}
                        >
                            Newer
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            disabled={page >= pages}
                            onClick={() => setPage(page + 1)}
                        >
                            Older
                        </Button>
                    </div>
                </footer>
            ) : null}
        </Panel>
    )
}

export function MonitorDetailPage() {
    const { id = '' } = useParams()
    const { user } = useAuth()
    const navigate = useNavigate()
    const toast = useToast()
    const [searchParams, setSearchParams] = useSearchParams()
    const period = (PERIODS.find((item) => item.key === searchParams.get('period'))?.key ??
        '24h') as PeriodKey
    const [dialog, setDialog] = useState<'rename' | 'delete' | null>(null)
    const [toggling, setToggling] = useState(false)

    const detail = useApi<MonitorDetail>(`/monitors/${id}`, { pollMs: 5_000 })
    const settling = detail.data?.monitor.status === 'PENDING' || detail.data?.monitor.retryPending
    const metrics = useApi<MonitorMetrics>(`/monitors/${id}/metrics?period=${period}`, {
        pollMs: settling ? 5_000 : 30_000,
    })
    const incidents = useApi<{ items: Incident[] }>(`/monitors/${id}/incidents?period=${period}`, {
        pollMs: 30_000,
    })

    function refreshAll() {
        detail.reload()
        metrics.reload()
        incidents.reload()
    }

    function setMonitor(monitor: Monitor) {
        detail.setData((current) => (current ? { ...current, monitor } : current))
    }

    async function togglePause(monitor: Monitor) {
        setToggling(true)
        const action = monitor.status === 'PAUSED' ? 'resume' : 'pause'
        try {
            const result = await api.post<{ monitor: Monitor }>(`/monitors/${monitor.id}/${action}`)
            setMonitor(result.monitor)
            toast(
                action === 'pause'
                    ? `${monitor.name} paused.`
                    : `${monitor.name} resumed. Checking now.`,
            )
            refreshAll()
        } catch (error) {
            toast(
                error instanceof ApiError ? error.message : 'Could not update the monitor.',
                'error',
            )
        } finally {
            setToggling(false)
        }
    }

    if (detail.error?.status === 404) {
        return (
            <div className="py-16 text-center">
                <h1 className="text-xl font-semibold">Monitor not found</h1>
                <p className="mt-2 text-sm text-ink-2">It may have been deleted.</p>
                <Link to="/app" className={buttonClass('secondary', 'md', 'mt-6')}>
                    Back to monitors
                </Link>
            </div>
        )
    }

    if (!detail.data) {
        return detail.error ? (
            <Alert>{detail.error.message}</Alert>
        ) : (
            <div className="space-y-4">
                <Skeleton className="h-24" />
                <Skeleton className="h-28" />
                <Skeleton className="h-72" />
            </div>
        )
    }

    const { monitor, lastCheck } = detail.data
    const m = metrics.data
    const paused = monitor.status === 'PAUSED'
    const exportBase = `/api/monitors/${monitor.id}/export`

    return (
        <div className="space-y-6">
            <Link
                to="/app"
                className="inline-flex items-center gap-1.5 text-[13px] text-ink-2 hover:text-ink"
            >
                <ArrowLeft size={14} aria-hidden="true" /> Monitors
            </Link>

            <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.025em] break-words">
                            {monitor.name}
                        </h1>
                        <StatusBadge status={monitor.status} size="lg" />
                    </div>
                    <a
                        href={monitor.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1.5 inline-flex max-w-full items-center gap-1.5 font-mono text-[13px] break-all text-ink-2 hover:text-ink"
                    >
                        {monitor.url}
                        <ExternalLink size={12} className="shrink-0" aria-hidden="true" />
                    </a>
                    <p className="mt-1 text-[13px] text-ink-3">
                        Checked every {formatInterval(user?.plan.checkIntervalSeconds ?? 300)} ·
                        added {formatRelative(monitor.createdAt)}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="secondary"
                        onClick={() => togglePause(monitor)}
                        busy={toggling}
                    >
                        {toggling ? null : paused ? (
                            <Play size={15} aria-hidden="true" />
                        ) : (
                            <Pause size={15} aria-hidden="true" />
                        )}
                        {paused ? 'Resume' : 'Pause'}
                    </Button>
                    <Button variant="secondary" onClick={() => setDialog('rename')}>
                        <Pencil size={15} aria-hidden="true" /> Rename
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => setDialog('delete')}
                        className="hover:border-down hover:text-down"
                    >
                        <Trash2 size={15} aria-hidden="true" /> Delete
                    </Button>
                </div>
            </header>

            <StateBanner detail={detail.data} />

            <div className="flex flex-wrap items-center justify-between gap-3">
                <PeriodPicker
                    value={period}
                    onChange={(key) =>
                        setSearchParams(key === '24h' ? {} : { period: key }, { replace: true })
                    }
                />
                <div className="flex flex-wrap items-center gap-2">
                    <span className="eyebrow mr-1">Export CSV</span>
                    <a
                        href={`${exportBase}/checks.csv?period=${period}`}
                        className={buttonClass('secondary', 'sm')}
                        download
                    >
                        <Download size={14} aria-hidden="true" /> Checks
                    </a>
                    <a
                        href={`${exportBase}/incidents.csv?period=${period}`}
                        className={buttonClass('secondary', 'sm')}
                        download
                    >
                        <Download size={14} aria-hidden="true" /> Incidents
                    </a>
                </div>
            </div>

            {m?.period.limitedByRetention ? (
                <Alert tone="info">
                    Your {user?.plan.name} plan keeps {formatRetention(m.period.retentionDays)} of
                    history, so this view starts {formatDateTime(m.period.from, false)}.
                </Alert>
            ) : null}

            {m ? (
                <div
                    className={cn(
                        'grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-rule bg-rule md:grid-cols-3 xl:grid-cols-6',
                        metrics.loading && 'opacity-70',
                    )}
                >
                    <Stat
                        label="Uptime"
                        value={formatPercent(m.availability.uptimePercent)}
                        tone={
                            m.availability.uptimePercent !== null &&
                            m.availability.uptimePercent < 99
                                ? 'text-down'
                                : undefined
                        }
                        detail={
                            m.availability.pausedMs > 0
                                ? `${formatDuration(m.availability.pausedMs)} paused, excluded`
                                : 'of monitored time'
                        }
                    />
                    <Stat
                        label="Downtime"
                        value={
                            m.availability.downtimeMs > 0
                                ? formatDuration(m.availability.downtimeMs)
                                : 'None'
                        }
                        tone={m.availability.downtimeMs > 0 ? 'text-down' : undefined}
                        detail={`${m.incidentCount} incident${m.incidentCount === 1 ? '' : 's'}`}
                    />
                    <Stat
                        label="Avg response"
                        value={formatMs(m.checks.avgResponseTime)}
                        detail={
                            m.checks.p95ResponseTime
                                ? `p95 ${formatMs(m.checks.p95ResponseTime)}`
                                : undefined
                        }
                    />
                    <Stat
                        label="Fastest / slowest"
                        value={
                            m.checks.minResponseTime ? `${formatMs(m.checks.minResponseTime)}` : '–'
                        }
                        detail={
                            m.checks.maxResponseTime
                                ? `slowest ${formatMs(m.checks.maxResponseTime)}`
                                : undefined
                        }
                    />
                    <Stat
                        label="Checks"
                        value={m.checks.total.toLocaleString('en-US')}
                        detail={`${m.checks.failures} failed · ${m.checks.retries} retries`}
                    />
                    <Stat
                        label="Last check"
                        value={formatRelative(monitor.lastCheckedAt)}
                        tone={lastCheck?.status === 'FAILURE' ? 'text-down' : undefined}
                        detail={
                            lastCheck
                                ? lastCheck.status === 'SUCCESS'
                                    ? `${lastCheck.statusCode} in ${formatMs(lastCheck.responseTime)}`
                                    : (lastCheck.errorMessage ?? 'Failed')
                                : 'No checks yet'
                        }
                    />
                </div>
            ) : (
                <Skeleton className="h-28" />
            )}

            <Panel>
                <PanelHeader
                    title="Availability"
                    description="Each tick is a slice of the period. Hover a tick for its time and uptime."
                />
                <div className="px-5 py-5">
                    {m ? (
                        <>
                            <TimelineStrip
                                buckets={m.timeline}
                                height={40}
                                shortLabels={period === '24h'}
                            />
                            <div className="mt-2 flex justify-between font-mono text-[11px] text-ink-3">
                                <span>
                                    {formatDateTime(m.timeline[0]?.from ?? m.period.from, false)}
                                </span>
                                <span>now</span>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-ink-2">
                                {[
                                    ['bg-up', 'No downtime'],
                                    ['bg-pending', 'Partial downtime'],
                                    ['bg-down', 'Down'],
                                    ['bg-paused/45', 'Paused'],
                                    ['bg-grid', 'No data'],
                                ].map(([color, label]) => (
                                    <span key={label} className="inline-flex items-center gap-1.5">
                                        <span className={cn('h-3 w-1.5 rounded-[1px]', color)} />
                                        {label}
                                    </span>
                                ))}
                            </div>
                        </>
                    ) : (
                        <Skeleton className="h-10" />
                    )}
                </div>
            </Panel>

            <Panel>
                <PanelHeader
                    title="Response time"
                    description={
                        m
                            ? `Average of successful checks per ${formatDuration(m.period.bucketSeconds * 1000)}. Failed checks have no response time.`
                            : 'Average of successful checks'
                    }
                />
                <div className="px-3 pt-3 pb-2 sm:px-5">
                    {m ? (
                        <ResponseTimeChart
                            points={m.responseTime}
                            revealKey={period}
                            domain={[new Date(m.period.dataFrom), new Date(m.period.to)]}
                        />
                    ) : (
                        <Skeleton className="aspect-[3/1]" />
                    )}
                </div>
            </Panel>

            <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
                <Panel>
                    <PanelHeader
                        title="Incidents"
                        description="Confirmed downtime: a failed check followed by a failed retry."
                    />
                    {incidents.data ? (
                        <IncidentList incidents={incidents.data.items} />
                    ) : (
                        <Skeleton className="m-5 h-24" />
                    )}
                </Panel>
                <Panel>
                    <PanelHeader
                        title="Errors"
                        description="Most frequent failure reasons in this period."
                    />
                    {m ? (
                        m.topErrors.length ? (
                            <ul className="divide-y divide-rule">
                                {m.topErrors.map((item) => (
                                    <li
                                        key={`${item.errorType}-${item.message}`}
                                        className="flex items-start justify-between gap-4 px-5 py-3"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm">{item.message}</p>
                                            <p className="mt-0.5 font-mono text-[11px] text-ink-3">
                                                {item.errorType.replace(/_/g, ' ')} · last{' '}
                                                {formatRelative(item.lastSeen)}
                                            </p>
                                        </div>
                                        <span className="font-mono text-sm text-ink-2">
                                            ×{item.occurrences}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="px-5 py-8 text-center text-sm text-ink-3">
                                No failed checks in this period.
                            </p>
                        )
                    ) : (
                        <Skeleton className="m-5 h-24" />
                    )}
                </Panel>
            </div>

            <ChecksTable monitorId={monitor.id} period={period} />

            <RenameMonitorDialog
                key={`rename-${dialog === 'rename'}`}
                monitor={monitor}
                open={dialog === 'rename'}
                onClose={() => setDialog(null)}
                onRenamed={(updated) => {
                    setMonitor(updated)
                    toast('Name saved.')
                }}
            />
            <DeleteMonitorDialog
                key={`delete-${dialog === 'delete'}`}
                monitor={monitor}
                open={dialog === 'delete'}
                onClose={() => setDialog(null)}
                onDeleted={() => {
                    toast(`${monitor.name} deleted.`)
                    navigate('/app', { replace: true })
                }}
            />
        </div>
    )
}
