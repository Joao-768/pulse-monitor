import { cn } from '@/lib/utils'

// Wordmark: a single heartbeat trace, then the name. The trace is the same
// shape as the favicon and carries the brand colour; the name is in ink.
export function Logo({ inverted = false, className }: { inverted?: boolean; className?: string }) {
    return (
        <span className={cn('inline-flex items-center gap-2', className)}>
            <svg viewBox="0 0 32 20" className="h-5 w-8" aria-hidden="true">
                <path
                    d="M1 11h7l2.5-8 4.5 15 3.5-11 2 4H31"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={inverted ? 'text-signal-on-dark' : 'text-signal'}
                />
            </svg>
            <span
                className={cn(
                    'text-[17px] font-semibold tracking-[-0.02em]',
                    inverted ? 'text-white' : 'text-ink',
                )}
            >
                pulse
                <span className={cn('font-light', inverted ? 'text-white/60' : 'text-ink-3')}>
                    monitor
                </span>
            </span>
        </span>
    )
}
