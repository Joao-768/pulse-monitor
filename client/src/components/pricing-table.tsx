import { Check } from 'lucide-react'
import { ButtonLink, Skeleton } from '@/components/ui'
import { usePlans } from '@/hooks/use-plans'
import { formatInterval, formatRetention } from '@/lib/format'
import type { Plan } from '@/lib/types'
import { cn } from '@/lib/utils'

// Plan limits come from the API (/api/plans), the same constants the backend
// enforces, so the table can never drift from the product.
export function PricingTable() {
    const { plans, error } = usePlans()

    if (error) {
        return (
            <p className="text-sm text-ink-2">
                Plans could not be loaded. Refresh the page to try again.
            </p>
        )
    }
    if (!plans) return <Skeleton className="h-80" />

    const rows: { label: string; value: (plan: Plan) => React.ReactNode }[] = [
        { label: 'Monitors', value: (plan) => plan.maxMonitors },
        {
            label: 'Check interval',
            value: (plan) => `every ${formatInterval(plan.checkIntervalSeconds)}`,
        },
        { label: 'History kept', value: (plan) => formatRetention(plan.retentionDays) },
        {
            label: 'Retry before calling it down',
            value: () => <Check size={16} className="text-up" aria-label="Included" />,
        },
        {
            label: 'Incidents and in-app notifications',
            value: () => <Check size={16} className="text-up" aria-label="Included" />,
        },
        {
            label: 'CSV export',
            value: () => <Check size={16} className="text-up" aria-label="Included" />,
        },
    ]

    return (
        <div className="overflow-x-auto rounded-lg border border-ink/80 bg-surface">
            <table className="w-full min-w-[560px] border-collapse text-left">
                <thead>
                    <tr className="border-b border-ink/80">
                        <th className="w-[34%] px-5 py-5 align-bottom">
                            <span className="eyebrow">Plan</span>
                        </th>
                        {plans.map((plan) => (
                            <th
                                key={plan.key}
                                className={cn(
                                    'px-5 py-5 align-bottom',
                                    plan.available && 'bg-signal-soft/60',
                                )}
                            >
                                <div className="text-lg font-semibold tracking-[-0.01em]">
                                    {plan.name}
                                </div>
                                <div className="mt-1 font-mono text-[12px] font-normal text-ink-2">
                                    {plan.available ? 'Free, no card' : 'Not on sale yet'}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.label} className="border-b border-rule last:border-b-0">
                            <th scope="row" className="px-5 py-3.5 text-sm font-normal text-ink-2">
                                {row.label}
                            </th>
                            {plans.map((plan) => (
                                <td
                                    key={plan.key}
                                    className={cn(
                                        'px-5 py-3.5 font-mono text-[14px] whitespace-nowrap',
                                        plan.available && 'bg-signal-soft/60',
                                    )}
                                >
                                    {row.value(plan)}
                                </td>
                            ))}
                        </tr>
                    ))}
                    <tr className="border-t border-ink/80">
                        <td className="px-5 py-4" />
                        {plans.map((plan) => (
                            <td
                                key={plan.key}
                                className={cn('px-5 py-4', plan.available && 'bg-signal-soft/60')}
                            >
                                {plan.available ? (
                                    <ButtonLink to="/register" size="sm">
                                        Create free account
                                    </ButtonLink>
                                ) : (
                                    <span className="inline-flex h-8 items-center rounded-md border border-dashed border-rule-strong px-3 text-[13px] whitespace-nowrap text-ink-3">
                                        Coming soon
                                    </span>
                                )}
                            </td>
                        ))}
                    </tr>
                </tbody>
            </table>
        </div>
    )
}
