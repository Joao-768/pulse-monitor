import { useMemo } from 'react'
import { HeroTrace } from '@/components/hero-trace'
import { PricingTable } from '@/components/pricing-table'
import { PublicFooter, PublicHeader } from '@/components/public-header'
import { ResponseTimeChart } from '@/components/response-chart'
import { StatusBadge, TimelineStrip } from '@/components/status'
import { ButtonLink } from '@/components/ui'
import type { MonitorStatus, TimelineBucket } from '@/lib/types'
import { cn } from '@/lib/utils'

const STEPS: { state: MonitorStatus; title: string; body: string }[] = [
    {
        state: 'UP',
        title: 'Check',
        body: 'A real GET request from our servers on a schedule: every 5 minutes on Free, down to every 30 seconds on Business. Any 2xx or 3xx answer passes.',
    },
    {
        state: 'PENDING',
        title: 'Retry',
        body: 'A timeout, a 5xx, a refused connection or a DNS failure is retried 15 seconds later instead of waiting for the next scheduled check.',
    },
    {
        state: 'DOWN',
        title: 'Incident',
        body: 'If the retry fails too, the monitor goes down, an incident opens with the reason and start time, and a notification lands in your inbox.',
    },
    {
        state: 'UP',
        title: 'Recovery',
        body: 'The first successful check closes the incident, records how long it lasted and tells you it is back.',
    },
]

const FEATURES = [
    [
        'Uptime by period',
        '24 hours, 7 days, 30 days or everything your plan keeps. Paused time is left out, not counted as up or down.',
    ],
    [
        'Response time trends',
        'A chart per monitor that shows a slow creep, a spike at 3 a.m., or a bad deploy.',
    ],
    [
        'Incident log',
        'Every outage with its start, end, duration and the reason the first failed check gave.',
    ],
    [
        'Every check, kept',
        'Status code, timing and error for each request. Retries are marked so blips are easy to tell apart.',
    ],
    [
        'CSV export',
        'Download checks or incidents for any period, for reports or your own analysis.',
    ],
    [
        'Notifications',
        'Down and back-up alerts inside the app, each one linking to the monitor it is about.',
    ],
]

// Deterministic illustration data for the example card.
function exampleData() {
    const now = Date.UTC(2026, 8, 28, 15, 0)
    const timeline: TimelineBucket[] = Array.from({ length: 48 }, (_, index) => ({
        from: new Date(now - (48 - index) * 30 * 60_000).toISOString(),
        state: index === 31 ? 'partial' : index === 32 ? 'down' : index === 33 ? 'partial' : 'up',
        uptimePercent: index === 32 ? 0 : index === 31 || index === 33 ? 62 : 100,
    }))
    const points = Array.from({ length: 96 }, (_, index) => {
        const wave = Math.sin(index / 7) * 18 + Math.sin(index / 2.3) * 7
        const creep = index > 70 ? (index - 70) * 4.5 : 0
        return {
            at: new Date(now - (96 - index) * 15 * 60_000).toISOString(),
            avg:
                index >= 63 && index <= 66
                    ? null
                    : Math.round(168 + wave + creep + (index === 40 ? 190 : 0)),
        }
    })
    return { timeline, points }
}

function ExampleMonitor() {
    const { timeline, points } = useMemo(() => exampleData(), [])
    return (
        <div className="rounded-xl border border-rule bg-surface shadow-[0_24px_48px_-28px_var(--shadow)]">
            <div className="flex items-start justify-between gap-4 border-b border-rule px-5 py-4">
                <div className="min-w-0">
                    <p className="text-[15px] font-semibold">Checkout API</p>
                    <p className="truncate font-mono text-[12px] text-ink-3">
                        api.shop.example/health
                    </p>
                </div>
                <StatusBadge status="UP" />
            </div>
            <div className="grid grid-cols-3 gap-px bg-rule">
                {[
                    ['Uptime · 24h', '99.31%'],
                    ['Downtime', '9m 54s'],
                    ['Avg response', '176 ms'],
                ].map(([label, value]) => (
                    <div key={label} className="bg-surface px-5 py-3">
                        <div className="eyebrow">{label}</div>
                        <div className="mt-1 font-mono text-lg">{value}</div>
                    </div>
                ))}
            </div>
            <div className="border-t border-rule px-5 pt-4 pb-2">
                <TimelineStrip buckets={timeline} height={26} />
                <div className="mt-1 flex justify-between font-mono text-[10px] text-ink-3">
                    <span>24h ago</span>
                    <span>now</span>
                </div>
            </div>
            <div className="px-2 pb-2">
                <ResponseTimeChart points={points} revealKey="example" />
            </div>
            <p className="border-t border-rule px-5 py-2.5 font-mono text-[10px] tracking-[0.08em] text-ink-3 uppercase">
                Example monitor · illustrative data
            </p>
        </div>
    )
}

export function LandingPage() {
    return (
        <div className="bg-paper">
            <PublicHeader />

            {/* Hero: the trace is the thesis. */}
            <section className="screen graph-paper border-b border-rule">
                <div className="mx-auto w-full max-w-7xl px-4 pt-10 sm:px-6 sm:pt-14">
                    <p className="eyebrow">Uptime monitoring for websites and APIs</p>
                    <h1 className="mt-4 max-w-[16ch] text-[clamp(2.6rem,6.4vw,5.6rem)] leading-[0.98] font-semibold tracking-[-0.045em]">
                        Know the moment it stops answering.
                    </h1>
                    <p className="mt-5 max-w-[52ch] text-[clamp(1rem,1.3vw,1.2rem)] leading-relaxed text-ink-2">
                        Pulse Monitor checks your websites and API endpoints around the clock,
                        confirms every failure before calling it downtime, and keeps the full
                        record: uptime, response time, incidents and recoveries.
                    </p>
                </div>
                <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
                    <HeroTrace />
                </div>
                <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-10 gap-y-5 px-4 pb-8 sm:px-6">
                    <div className="flex flex-wrap gap-3">
                        <ButtonLink to="/register" size="lg">
                            Start monitoring for free
                        </ButtonLink>
                        <ButtonLink to="/login" size="lg" variant="secondary">
                            Log in
                        </ButtonLink>
                    </div>
                    <dl className="grid grid-cols-3 gap-x-8 font-mono text-[12px]">
                        {[
                            ['5 monitors', 'on the Free plan'],
                            ['1 retry', 'before any alert'],
                            ['7 to 365 days', 'of history'],
                        ].map(([value, label]) => (
                            <div key={value}>
                                <dt className="text-ink">{value}</dt>
                                <dd className="text-ink-3">{label}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </section>

            {/* How it works: a real sequence, so it is numbered. */}
            <section id="how-it-works" className="screen scroll-mt-14 border-b border-rule">
                <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-12 sm:px-6">
                    <p className="eyebrow">What happens when a check fails</p>
                    <div className="screen-body">
                        <div className="grid grid-cols-1 gap-12 [&>*]:min-w-0 lg:grid-cols-[1fr_1.15fr] lg:items-center">
                            <div>
                                <h2 className="text-[clamp(2.1rem,4.4vw,3.8rem)] leading-[1.02] font-semibold tracking-[-0.04em]">
                                    One failed request is not an outage.
                                </h2>
                                <p className="mt-6 max-w-[46ch] text-[clamp(1rem,1.25vw,1.15rem)] leading-relaxed text-ink-2">
                                    Networks drop packets and servers hiccup. Pulse Monitor confirms
                                    a failure with a quick retry before it opens an incident, so an
                                    alert means something is really wrong, and the downtime you see
                                    is downtime that happened.
                                </p>
                            </div>
                            <ol className="relative ml-[13px]">
                                {STEPS.map((step, index) => (
                                    <li
                                        key={step.title}
                                        // The connector runs from this circle's centre to the next one's,
                                        // so nothing sticks out above the first step or below the last.
                                        className="relative pb-8 pl-8 before:absolute before:top-[15px] before:-bottom-[15px] before:left-[-0.5px] before:w-px before:bg-ink/80 last:pb-0 last:before:hidden"
                                    >
                                        <span className="absolute top-0.5 -left-[13px] flex h-[26px] w-[26px] items-center justify-center rounded-full border border-ink/80 bg-paper font-mono text-[11px]">
                                            {index + 1}
                                        </span>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h3 className="text-[clamp(1.15rem,1.6vw,1.4rem)] font-semibold tracking-[-0.015em]">
                                                {step.title}
                                            </h3>
                                            <StatusBadge status={step.state} />
                                        </div>
                                        <p className="mt-2 max-w-[54ch] text-[15px] leading-relaxed text-ink-2">
                                            {step.body}
                                        </p>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features beside a working example of the monitor view. */}
            <section id="features" className="screen scroll-mt-14 border-b border-rule bg-surface">
                <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-12 sm:px-6">
                    <p className="eyebrow">What you get for every monitor</p>
                    <div className="screen-body">
                        <div className="grid grid-cols-1 gap-12 [&>*]:min-w-0 lg:grid-cols-[1fr_1.1fr] lg:items-center">
                            <div>
                                <h2 className="text-[clamp(2.1rem,4.4vw,3.8rem)] leading-[1.02] font-semibold tracking-[-0.04em]">
                                    The whole history, not only a green light.
                                </h2>
                                <dl className="mt-8 divide-y divide-rule border-y border-rule">
                                    {FEATURES.map(([title, body]) => (
                                        <div
                                            key={title}
                                            className="grid gap-1 py-3.5 sm:grid-cols-[11rem_1fr] sm:gap-6"
                                        >
                                            <dt className="text-[15px] font-medium">{title}</dt>
                                            <dd className="text-[14px] leading-relaxed text-ink-2">
                                                {body}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>
                            <ExampleMonitor />
                        </div>
                    </div>
                </div>
            </section>

            <section id="pricing" className="screen scroll-mt-14 border-b border-rule">
                <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-12 sm:px-6">
                    <p className="eyebrow">Pricing</p>
                    <div className="screen-body">
                        <div className="grid grid-cols-1 gap-12 [&>*]:min-w-0 lg:grid-cols-[1fr_1.6fr] lg:items-center">
                            <div>
                                <h2 className="text-[clamp(2.1rem,4.4vw,3.8rem)] leading-[1.02] font-semibold tracking-[-0.04em]">
                                    Start free. Grow into faster checks.
                                </h2>
                                <p className="mt-6 max-w-[42ch] text-[clamp(1rem,1.25vw,1.15rem)] leading-relaxed text-ink-2">
                                    Every account starts on Free, with the same checks, retries,
                                    incidents and exports as the larger plans. Pro and Business add
                                    more monitors, shorter intervals and longer history, and open
                                    soon.
                                </p>
                            </div>
                            <PricingTable />
                        </div>
                    </div>
                </div>
            </section>

            <section className="screen">
                <div className="mx-auto grid w-full max-w-7xl flex-1 grid-rows-[auto_1fr_auto] gap-8 px-4 pt-12 sm:px-6">
                    <p className="eyebrow">Get started</p>
                    <div className="grid grid-cols-1 content-center gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-end">
                        <h2 className="text-[clamp(2.6rem,7vw,6rem)] leading-[0.96] font-semibold tracking-[-0.05em]">
                            Stop refreshing tabs to see if it is still up.
                        </h2>
                        <div className="space-y-6">
                            <p className="text-[clamp(1rem,1.25vw,1.15rem)] leading-relaxed text-ink-2">
                                Add a URL, and the first check runs before the dialog closes. From
                                then on it runs on our servers, whether your laptop is open or not.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <ButtonLink to="/register" size="lg">
                                    Create a free account
                                </ButtonLink>
                                <ButtonLink to="/login" size="lg" variant="secondary">
                                    Log in
                                </ButtonLink>
                            </div>
                        </div>
                    </div>
                    <div className={cn('-mx-4 sm:-mx-6')}>
                        <PublicFooter />
                    </div>
                </div>
            </section>
        </div>
    )
}

export function PricingPage() {
    return (
        <div className="flex min-h-svh flex-col bg-paper">
            <PublicHeader />
            <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-14 sm:px-6">
                <p className="eyebrow">Pricing</p>
                <h1 className="mt-3 max-w-[20ch] text-[clamp(2.2rem,5vw,3.8rem)] leading-[1.02] font-semibold tracking-[-0.04em]">
                    Start free. Grow into faster checks.
                </h1>
                <p className="mt-5 max-w-[60ch] text-[17px] leading-relaxed text-ink-2">
                    All plans run the same checks, retries, incidents, notifications and CSV
                    exports. They differ in how many monitors you can keep, how often each one is
                    checked, and how long history is kept. Pro and Business are not on sale yet.
                </p>
                <div className="mt-10">
                    <PricingTable />
                </div>
                <dl className="mt-12 grid gap-8 md:grid-cols-3">
                    {[
                        [
                            'Do paused monitors count?',
                            'Yes. A paused monitor keeps its history and its place in your plan until you delete it.',
                        ],
                        [
                            'What happens to old data?',
                            'Checks and incidents older than your plan keeps are deleted automatically every night.',
                        ],
                        [
                            'What counts as down?',
                            'A failed check followed by a failed retry 15 seconds later. A single blip that recovers on retry is logged but costs no uptime.',
                        ],
                    ].map(([question, answer]) => (
                        <div key={question}>
                            <dt className="font-medium">{question}</dt>
                            <dd className="mt-2 text-sm leading-relaxed text-ink-2">{answer}</dd>
                        </div>
                    ))}
                </dl>
            </main>
            <PublicFooter />
        </div>
    )
}
