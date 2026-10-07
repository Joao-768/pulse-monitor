import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, api } from '@/lib/api'

interface Options {
    // Refetch every N ms while the tab is visible.
    pollMs?: number
    enabled?: boolean
}

// Small data hook: loading/error state, manual reload, and optional polling
// that keeps the previous data on screen while refreshing.
//
// `loading` is derived: it is true until a response for the current path has
// arrived, so changing the path (a new page or filter) shows it again while
// background polls do not.
export function useApi<T>(path: string | null, { pollMs, enabled = true }: Options = {}) {
    const key = path && enabled ? path : null
    const [data, setData] = useState<T | null>(null)
    const [error, setError] = useState<ApiError | null>(null)
    const [settledKey, setSettledKey] = useState<string | null>(null)
    const requestId = useRef(0)

    const load = useCallback(async () => {
        if (!key) return
        const id = ++requestId.current
        try {
            const result = await api.get<T>(key)
            if (id !== requestId.current) return
            setData(result)
            setError(null)
        } catch (caught) {
            if (id !== requestId.current) return
            setError(
                caught instanceof ApiError
                    ? caught
                    : new ApiError(0, 'UNKNOWN', 'Something went wrong.'),
            )
        } finally {
            if (id === requestId.current) setSettledKey(key)
        }
    }, [key])

    useEffect(() => {
        // State is only set once the response arrives, never synchronously here.
        // oxlint-disable-next-line react/set-state-in-effect
        load()
    }, [load])

    useEffect(() => {
        if (!pollMs || !key) return
        const timer = window.setInterval(() => {
            if (document.visibilityState === 'visible') load()
        }, pollMs)
        return () => window.clearInterval(timer)
    }, [pollMs, key, load])

    const loading = key !== null && settledKey !== key

    return { data, error, loading, reload: load, setData }
}
