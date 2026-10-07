import { useId } from 'react'
import { cn } from '@/lib/utils'

// The landing page's signature: a strip-chart trace that tells the product's
// story left to right. Normal beats (successful checks), a failure, a failed
// retry, a flat red stretch of confirmed downtime, then recovery.
// Illustrative, not live data.

const WIDTH = 1200
const HEIGHT = 240
const BASE = 196
const PERIOD = 88

function beat(x: number, amplitude: number) {
    const b = BASE
    return [
        `L${x + 8} ${b}`,
        `Q${x + 13} ${b - 9} ${x + 18} ${b}`,
        `L${x + 25} ${b}`,
        `L${x + 28} ${b + 9}`,
        `L${x + 32} ${b - amplitude}`,
        `L${x + 36} ${b + 16}`,
        `L${x + 40} ${b}`,
        `L${x + 50} ${b}`,
        `Q${x + 59} ${b - 15} ${x + 68} ${b}`,
    ].join(' ')
}

function beats(from: number, to: number, amplitudes: number[]) {
    let d = `M${from} ${BASE}`
    let index = 0
    for (let x = from; x + PERIOD <= to + 1; x += PERIOD) {
        d += ' ' + beat(x, amplitudes[index % amplitudes.length])
        index++
    }
    return `${d} L${to} ${BASE}`
}

const FAIL_X = 632
const RETRY_X = 664
const RECOVER_X = 858

const before = beats(0, FAIL_X, [96, 108, 90, 102, 158, 99, 94])
const down = `M${FAIL_X} ${BASE} L${RECOVER_X} ${BASE}`
const after = beats(RECOVER_X, WIDTH, [101, 93, 104, 97])

// The pen sweeps left to right; annotations appear as it reaches them.
const DRAW_MS = 3600
const at = (x: number) => Math.round((x / WIDTH) * DRAW_MS)

// Annotations live in their own bands above and below the trace, so a tall
// beat can never run into the text.
function Note({
    x,
    band,
    tone,
    time,
    children,
    className,
}: {
    x: number
    band: 'top' | 'bottom'
    tone: 'ink' | 'down' | 'up' | 'pending'
    time: string
    children: React.ReactNode
    className?: string
}) {
    const color = {
        ink: 'border-ink-3 text-ink-2',
        down: 'border-down text-down',
        up: 'border-up text-up',
        pending: 'border-pending text-pending-text',
    }[tone]
    return (
        <div
            className={cn(
                'trace-note absolute border-l pl-2 font-mono text-[11px] leading-snug',
                band === 'top' ? 'top-0' : 'bottom-0',
                color,
                className,
            )}
            style={{ left: `${(x / WIDTH) * 100}%`, animationDelay: `${at(x)}ms` }}
        >
            <div className="text-ink-3">{time}</div>
            <div className="font-medium whitespace-nowrap">{children}</div>
        </div>
    )
}

export function HeroTrace() {
    const clipId = `trace-reveal-${useId().replace(/:/g, '')}`

    return (
        <div className="relative h-full min-h-[260px] w-full">
            <svg
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                preserveAspectRatio="none"
                className="absolute inset-x-0 top-12 bottom-12 h-[calc(100%-6rem)] w-full overflow-visible"
                role="img"
                aria-label="A monitor's response trace: steady checks, a failed check, a failed retry, a stretch of downtime, then recovery."
            >
                <defs>
                    {/* One clip rectangle grows from the left: it reveals the
                        trace, the red stretch and the band in sync. */}
                    <clipPath id={clipId}>
                        <rect
                            className="trace-reveal"
                            x="0"
                            y={-HEIGHT}
                            width={WIDTH}
                            height={HEIGHT * 3}
                            style={{ animationDuration: `${DRAW_MS}ms` }}
                        />
                    </clipPath>
                </defs>
                <g clipPath={`url(#${clipId})`}>
                    <rect
                        x={FAIL_X}
                        y={-24}
                        width={RECOVER_X - FAIL_X}
                        height={HEIGHT + 48}
                        fill="var(--down)"
                        opacity="0.07"
                    />
                    <path
                        d={before}
                        fill="none"
                        stroke="var(--signal)"
                        strokeWidth="2.2"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                    />
                    <path
                        d={down}
                        fill="none"
                        stroke="var(--down)"
                        strokeWidth="2.6"
                        vectorEffect="non-scaling-stroke"
                    />
                    <path
                        d={after}
                        fill="none"
                        stroke="var(--signal)"
                        strokeWidth="2.2"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                    />
                </g>
            </svg>

            <Note
                x={4 * PERIOD + 32}
                band="top"
                tone="ink"
                time="14:02:10"
                className="hidden md:block"
            >
                200 · 612 ms, a slow one
            </Note>
            {/* On phones the retry note is hidden, so this one takes the top band. */}
            <Note
                x={FAIL_X}
                band="bottom"
                tone="pending"
                time="14:07:12"
                className="max-sm:top-0 max-sm:bottom-auto max-sm:text-[10px]"
            >
                Timeout. Retrying in 15 s
            </Note>
            <Note x={RETRY_X} band="top" tone="down" time="14:07:27" className="hidden sm:block">
                Retry failed · incident opened
            </Note>
            <Note
                x={RECOVER_X}
                band="bottom"
                tone="up"
                time="14:19:31"
                className="max-sm:-translate-x-full max-sm:border-r max-sm:border-l-0 max-sm:pr-2 max-sm:pl-0 max-sm:text-right max-sm:text-[10px]"
            >
                200 OK · back up after 12m 19s
            </Note>
        </div>
    )
}
