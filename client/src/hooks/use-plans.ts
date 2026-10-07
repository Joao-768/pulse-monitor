import { useApi } from '@/hooks/use-api'
import type { Plan } from '@/lib/types'

// Plan limits come from /api/plans: the same constants the backend enforces,
// so copy on the site can never drift from the product.
export function usePlans() {
    const { data, error } = useApi<{ plans: Plan[] }>('/plans')
    const plans = data?.plans ?? null
    return {
        plans,
        error,
        free: plans?.find((plan) => plan.key === 'FREE') ?? null,
    }
}
