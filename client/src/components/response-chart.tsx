import { useMemo } from 'react'
import {
    Area,
    AreaChart,
    ChartTooltip,
    Grid,
    Line,
    LineChart,
    XAxis,
    YAxis,
} from '@/components/charts'
import { formatMs } from '@/lib/format'

interface Point {
    at: string
    avg: number | null
    max?: number | null
    checks?: number
    failures?: number
}

// Response time over the selected period (Bklit area chart). Buckets where
// every check failed carry no response time and are left out of the line;
// the availability strip above the chart shows those periods instead.
export function ResponseTimeChart({
    points,
    revealKey,
    domain,
}: {
    points: Point[]
    revealKey: string
    // Full period, so stretches without successful checks show as gaps at
    // their real position instead of the axis ending at the last data point.
    domain?: [Date, Date]
}) {
    const data = useMemo(
        () =>
            points
                .filter((point) => point.avg !== null)
                .map((point) => ({
                    date: new Date(point.at),
                    avg: point.avg,
                    max: point.max ?? point.avg,
                    checks: point.checks ?? 0,
                    failures: point.failures ?? 0,
                })),
        [points],
    )

    if (data.length < 2) {
        return (
            <div className="graph-paper flex aspect-[3/1] items-center justify-center rounded-md border border-rule text-sm text-ink-3">
                Not enough checks in this period to draw a trend yet.
            </div>
        )
    }

    return (
        <AreaChart
            data={data}
            aspectRatio="7 / 2"
            className="min-h-[220px]"
            margin={{ top: 16, right: 16, bottom: 36, left: 64 }}
            animationDuration={700}
            revealSignature={revealKey}
            xDomain={domain}
        >
            <Grid horizontal numTicksRows={4} />
            <Area dataKey="avg" fillOpacity={0.18} strokeWidth={1.75} />
            <YAxis numTicks={4} formatValue={(value) => formatMs(value)} />
            <XAxis numTicks={6} />
            <ChartTooltip
                rows={(point) => {
                    const rows = [
                        {
                            color: 'var(--signal)',
                            label: 'Average',
                            value: formatMs(point.avg as number),
                        },
                        {
                            color: 'var(--ink-3)',
                            label: 'Slowest',
                            value: formatMs(point.max as number),
                        },
                    ]
                    const failures = point.failures as number
                    if (failures > 0) {
                        rows.push({
                            color: 'var(--down)',
                            label: 'Failed checks',
                            value: `${failures} of ${point.checks}`,
                        })
                    }
                    return rows
                }}
            />
        </AreaChart>
    )
}

// Tiny response-time trace for dashboard rows: no axes, no interaction.
export function ResponseSparkline({ points }: { points: { at: string; avg: number }[] }) {
    const data = useMemo(
        () => points.map((point) => ({ date: new Date(point.at), avg: point.avg })),
        [points],
    )
    if (data.length < 2) {
        return (
            <svg
                className="h-full w-full text-rule-strong"
                aria-hidden="true"
                preserveAspectRatio="none"
                viewBox="0 0 64 28"
            >
                <path d="M0 14h64" stroke="currentColor" strokeDasharray="3 3" fill="none" />
            </svg>
        )
    }
    return (
        <div className="pointer-events-none h-full w-full" aria-hidden="true">
            <LineChart
                data={data}
                aspectRatio="auto"
                style={{ height: '100%' }}
                margin={{ top: 3, right: 2, bottom: 3, left: 2 }}
                animationDuration={500}
            >
                <Line dataKey="avg" strokeWidth={1.5} stroke="var(--ink-2)" showHighlight={false} />
            </LineChart>
        </div>
    )
}
