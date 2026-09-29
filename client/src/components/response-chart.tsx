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

type ChartRow = {
    date: Date
    avg: number | null
    max: number | null
    checks: number
    failures: number
} & Record<string, unknown>

// Response time over the selected period (Bklit area chart). Buckets where
// every check failed carry no response time. Where no successful check was
// seen for longer than a few expected intervals (an outage, or the checker
// being stopped), a null point is inserted so the line breaks instead of
// drawing a smooth curve through time with no measurements.
export function ResponseTimeChart({
    points,
    revealKey,
    domain,
    expectedSpacingSeconds,
}: {
    points: Point[]
    revealKey: string
    // Full period, so stretches without successful checks show as gaps at
    // their real position instead of the axis ending at the last data point.
    domain?: [Date, Date]
    // Normal distance between points: the larger of the bucket size and the
    // check interval. Omit to never break the line.
    expectedSpacingSeconds?: number
}) {
    const data = useMemo(() => {
        const measured = points.filter((point) => point.avg !== null)
        const rows: ChartRow[] = []
        const gapMs = expectedSpacingSeconds ? expectedSpacingSeconds * 2.5 * 1000 : Infinity

        measured.forEach((point, index) => {
            const date = new Date(point.at)
            const previous = measured[index - 1]
            if (previous) {
                const previousTime = new Date(previous.at).getTime()
                if (date.getTime() - previousTime > gapMs) {
                    rows.push({
                        date: new Date((previousTime + date.getTime()) / 2),
                        avg: null,
                        max: null,
                        checks: 0,
                        failures: 0,
                    })
                }
            }
            rows.push({
                date,
                avg: point.avg,
                max: point.max ?? point.avg,
                checks: point.checks ?? 0,
                failures: point.failures ?? 0,
            })
        })
        return rows
    }, [points, expectedSpacingSeconds])

    const measuredCount = data.filter((row) => row.avg !== null).length

    // One label per day for spans of a few days, so no day is skipped;
    // six evenly spaced labels otherwise.
    const spanDays = domain ? (domain[1].getTime() - domain[0].getTime()) / 86_400_000 : 0
    const xTicks = spanDays > 1.5 && spanDays <= 10 ? Math.round(spanDays) + 1 : 6

    if (measuredCount < 2) {
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
            <Area
                dataKey="avg"
                fill="var(--ink)"
                stroke="var(--ink)"
                fillOpacity={0.1}
                strokeWidth={1.5}
            />
            <YAxis numTicks={4} formatValue={(value) => formatMs(value)} />
            <XAxis numTicks={xTicks} tickMode="domain" />
            <ChartTooltip
                dotColor={(point) =>
                    typeof point.avg === 'number'
                        ? 'var(--chart-tooltip-foreground)'
                        : 'transparent'
                }
                rows={(point) => {
                    if (typeof point.avg !== 'number') {
                        return [
                            {
                                color: 'var(--chart-tooltip-muted)',
                                label: 'No successful checks',
                                value: '–',
                            },
                        ]
                    }
                    const rows = [
                        {
                            color: 'var(--chart-tooltip-foreground)',
                            label: 'Average',
                            value: formatMs(point.avg as number),
                        },
                        {
                            color: 'var(--chart-tooltip-muted)',
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
