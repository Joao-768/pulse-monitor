import type { MonitorStatus, TimelineBucket, TimelineState } from '@/lib/types'
import { formatPercent, formatTime, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'

const LABELS: Record<MonitorStatus, string> = {
    UP: 'Up',
    DOWN: 'Down',
    PENDING: 'Checking',
    PAUSED: 'Paused',
}

const DOT: Record<MonitorStatus, string> = {
    UP: 'bg-up',
    DOWN: 'bg-down',
    PENDING: 'bg-pending',
    PAUSED: 'bg-paused',
}

const BADGE: Record<MonitorStatus, string> = {
    UP: 'bg-up-soft text-[#0a6e45]',
    DOWN: 'bg-down-soft text-[#a1242a]',
    PENDING: 'bg-pending-soft text-[#8a5900]',
    PAUSED: 'bg-paused-soft text-ink-2',
}

// The dot beats while a monitor is down or being checked; a steady dot means
// nothing needs attention.
export function StatusDot({ status, className }: { status: MonitorStatus; className?: string }) {
    const animated = status === 'DOWN' || status === 'PENDING'
    return (
        <span
            className={cn('relative inline-flex h-2.5 w-2.5 shrink-0', className)}
            aria-hidden="true"
        >
            {animated ? (
                <span
                    className={cn(
                        'absolute inset-0 animate-ping rounded-full opacity-60',
                        DOT[status],
                    )}
                />
            ) : null}
            {status === 'PAUSED' ? (
                <span className="relative inline-flex h-2.5 w-2.5 items-center justify-center gap-[2px]">
                    <span className="h-2.5 w-[3px] rounded-[1px] bg-paused" />
                    <span className="h-2.5 w-[3px] rounded-[1px] bg-paused" />
                </span>
            ) : (
                <span
                    className={cn('relative inline-flex h-2.5 w-2.5 rounded-full', DOT[status])}
                />
            )}
        </span>
    )
}

export function StatusBadge({
    status,
    size = 'md',
}: {
    status: MonitorStatus
    size?: 'md' | 'lg'
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-2 rounded-full font-mono font-medium tracking-wide uppercase',
                size === 'lg' ? 'px-3 py-1.5 text-xs' : 'px-2.5 py-1 text-[11px]',
                BADGE[status],
            )}
        >
            <StatusDot status={status} />
            {LABELS[status]}
        </span>
    )
}

const TIMELINE_COLORS: Record<TimelineState, string> = {
    up: 'bg-up',
    partial: 'bg-pending',
    down: 'bg-down',
    paused: 'bg-paused/45',
    none: 'bg-grid',
}

const TIMELINE_LABELS: Record<TimelineState, string> = {
    up: 'No downtime',
    partial: 'Partial downtime',
    down: 'Down',
    paused: 'Paused',
    none: 'No data',
}

function describeBucket(bucket: TimelineBucket, short: boolean) {
    const start = short ? formatTime(bucket.from) : formatDateTime(bucket.from, false)
    const uptime =
        bucket.uptimePercent !== null && bucket.state !== 'none' && bucket.state !== 'paused'
            ? ` · ${formatPercent(bucket.uptimePercent)} uptime`
            : ''
    return `${start} · ${TIMELINE_LABELS[bucket.state]}${uptime}`
}

// Availability over time as a row of ticks, one per bucket. Reads like the
// trace of a strip-chart recorder: green is quiet, red is where it broke.
export function TimelineStrip({
    buckets,
    height = 28,
    shortLabels = true,
    className,
}: {
    buckets: TimelineBucket[]
    height?: number
    shortLabels?: boolean
    className?: string
}) {
    const down = buckets.filter(
        (bucket) => bucket.state === 'down' || bucket.state === 'partial',
    ).length
    return (
        <div
            role="img"
            aria-label={`${buckets.length} time slots, ${down} with downtime`}
            className={cn('flex items-stretch gap-px sm:gap-[2px]', className)}
            style={{ height }}
        >
            {buckets.map((bucket) => (
                <span
                    key={bucket.from}
                    title={describeBucket(bucket, shortLabels)}
                    className={cn(
                        'min-w-px flex-1 rounded-[1.5px] transition-opacity hover:opacity-70',
                        TIMELINE_COLORS[bucket.state],
                    )}
                />
            ))}
        </div>
    )
}
