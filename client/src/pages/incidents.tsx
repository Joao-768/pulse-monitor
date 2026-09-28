import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Button, Skeleton } from '@/components/ui'
import { useApi } from '@/hooks/use-api'
import { formatDateTime, formatDuration } from '@/lib/format'
import type { Incident, Page } from '@/lib/types'
import { cn } from '@/lib/utils'

const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Ongoing' },
    { key: 'resolved', label: 'Resolved' },
] as const

export function IncidentsPage() {
    const [status, setStatus] = useState<(typeof FILTERS)[number]['key']>('all')
    const [page, setPage] = useState(1)
    const { data, error, loading } = useApi<Page<Incident>>(
        `/incidents?status=${status}&page=${page}`,
        {
            pollMs: 30_000,
        },
    )
    const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="eyebrow">All monitors</p>
                    <h1 className="mt-1 text-[28px] font-semibold tracking-[-0.025em]">
                        Incidents
                    </h1>
                    <p className="mt-1 max-w-xl text-sm text-ink-2">
                        An incident opens when a check fails and the retry fails too, and closes on
                        the next successful check.
                    </p>
                </div>
                <div className="inline-flex rounded-md border border-rule-strong bg-surface p-0.5">
                    {FILTERS.map((item) => (
                        <button
                            key={item.key}
                            aria-pressed={status === item.key}
                            onClick={() => {
                                setStatus(item.key)
                                setPage(1)
                            }}
                            className={cn(
                                'h-8 rounded px-3 text-[13px] font-medium',
                                status === item.key
                                    ? 'bg-primary text-primary-fg'
                                    : 'text-ink-2 hover:bg-paper',
                            )}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {error ? <Alert>{error.message}</Alert> : null}
            {!data && loading ? <Skeleton className="h-72" /> : null}

            {data ? (
                <section className="overflow-hidden rounded-lg border border-rule bg-surface">
                    {data.items.length === 0 ? (
                        <p className="px-5 py-14 text-center text-sm text-ink-3">
                            {status === 'active'
                                ? 'Nothing is down right now.'
                                : 'No incidents recorded in your retained history.'}
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table
                                className={cn(
                                    'w-full min-w-[720px] text-left text-sm',
                                    loading && 'opacity-60',
                                )}
                            >
                                <thead>
                                    <tr className="border-b border-rule">
                                        {['Monitor', 'Reason', 'Started', 'Ended', 'Duration'].map(
                                            (heading) => (
                                                <th
                                                    key={heading}
                                                    className="eyebrow px-5 py-2.5 font-medium"
                                                >
                                                    {heading}
                                                </th>
                                            ),
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-rule">
                                    {data.items.map((incident) => (
                                        <tr
                                            key={incident.id}
                                            className={
                                                incident.active ? 'bg-down-soft/40' : undefined
                                            }
                                        >
                                            <td className="px-5 py-3">
                                                <Link
                                                    to={`/app/monitors/${incident.monitorId}`}
                                                    className="font-medium hover:text-signal hover:underline"
                                                >
                                                    {incident.monitorName}
                                                </Link>
                                            </td>
                                            <td
                                                className="max-w-[18rem] truncate px-5 py-3 text-ink-2"
                                                title={incident.reason}
                                            >
                                                {incident.reason}
                                            </td>
                                            <td className="px-5 py-3 font-mono text-[12.5px] whitespace-nowrap text-ink-2">
                                                {formatDateTime(incident.startedAt, false)}
                                            </td>
                                            <td className="px-5 py-3 font-mono text-[12.5px] whitespace-nowrap">
                                                {incident.active ? (
                                                    <span className="rounded-full bg-down px-2 py-0.5 text-[10px] tracking-wide text-white uppercase">
                                                        Ongoing
                                                    </span>
                                                ) : (
                                                    <span className="text-ink-2">
                                                        {formatDateTime(
                                                            incident.resolvedAt as string,
                                                            false,
                                                        )}
                                                        {incident.resolution === 'PAUSED' ? (
                                                            <span className="ml-1.5 text-ink-3">
                                                                (paused)
                                                            </span>
                                                        ) : null}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 font-mono text-[13px] whitespace-nowrap">
                                                {formatDuration(incident.durationMs)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {pages > 1 ? (
                        <footer className="flex items-center justify-between border-t border-rule px-5 py-3 text-[13px]">
                            <span className="font-mono text-ink-2">
                                Page {page} of {pages}
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
                </section>
            ) : null}
        </div>
    )
}
