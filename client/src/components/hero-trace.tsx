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

// Stages share one clock so the annotations appear as the pen reaches them.
const DRAW_MS = 3600
const at = (x: number) => Math.round((x / WIDTH) * DRAW_MS)

function Note({
    x,
    top,
    tone,
    time,
    children,
    className,
}: {
    x: number
    top: string
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
                color,
                className,
            )}
            style={{ left: `${(x / WIDTH) * 100}%`, top, animationDelay: `${at(x)}ms` }}
        >
            <div className="text-ink-3">{time}</div>
            <div className="font-medium whitespace-nowrap">{children}</div>
        </div>
    )
}

export function HeroTrace() {
    return (
        <div className="relative h-full min-h-[200px] w-full">
            <style>{`
                .trace-path { stroke-dasharray: 1; stroke-dashoffset: 1; animation: trace-draw linear forwards; }
                .trace-note { opacity: 0; animation: trace-note 400ms ease-out forwards; }
                @keyframes trace-draw { to { stroke-dashoffset: 0; } }
                @keyframes trace-note { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
                @media (prefers-reduced-motion: reduce) {
                    .trace-path { stroke-dashoffset: 0; animation: none; }
                    .trace-note { opacity: 1; animation: none; }
                }
            `}</style>
            <svg
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full overflow-visible"
                role="img"
                aria-label="A monitor's response trace: steady checks, a failed check, a failed retry, a stretch of downtime, then recovery."
            >
                <rect
                    x={FAIL_X}
                    y="0"
                    width={RECOVER_X - FAIL_X}
                    height={HEIGHT}
                    fill="var(--down)"
                    opacity="0.06"
                />
                <path
                    d={before}
                    pathLength={1}
                    className="trace-path"
                    style={{ animationDuration: `${at(FAIL_X)}ms` }}
                    fill="none"
                    stroke="var(--ink)"
                    strokeWidth="2.2"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                />
                <path
                    d={down}
                    pathLength={1}
                    className="trace-path"
                    style={{
                        animationDuration: `${at(RECOVER_X - FAIL_X)}ms`,
                        animationDelay: `${at(FAIL_X)}ms`,
                    }}
                    fill="none"
                    stroke="var(--down)"
                    strokeWidth="2.6"
                    vectorEffect="non-scaling-stroke"
                />
                <path
                    d={after}
                    pathLength={1}
                    className="trace-path"
                    style={{
                        animationDuration: `${at(WIDTH - RECOVER_X)}ms`,
                        animationDelay: `${at(RECOVER_X)}ms`,
                    }}
                    fill="none"
                    stroke="var(--ink)"
                    strokeWidth="2.2"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                />
            </svg>

            <Note
                x={4 * PERIOD + 32}
                top="0%"
                tone="ink"
                time="14:02:10"
                className="hidden md:block"
            >
                200 · 612 ms, a slow one
            </Note>
            <Note
                x={FAIL_X}
                top="86%"
                tone="pending"
                time="14:07:12"
                className="max-sm:top-[4%]! max-sm:text-[10px]"
            >
                Timeout. Retrying in 15 s
            </Note>
            <Note x={RETRY_X} top="8%" tone="down" time="14:07:27" className="hidden sm:block">
                Retry failed · incident opened
            </Note>
            <Note
                x={RECOVER_X}
                top="86%"
                tone="up"
                time="14:19:31"
                className="max-sm:-translate-x-full max-sm:border-l-0 max-sm:border-r max-sm:pr-2 max-sm:pl-0 max-sm:text-right max-sm:text-[10px]"
            >
                200 OK · back up after 12m 19s
            </Note>
        </div>
    )
}
