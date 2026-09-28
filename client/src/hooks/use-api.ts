import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, api } from '@/lib/api'

interface Options {
    // Refetch every N ms while the tab is visible.
    pollMs?: number
    enabled?: boolean
}

// Small data hook: loading/error state, manual reload, and optional polling
// that keeps the previous data on screen while refreshing.
export function useApi<T>(path: string | null, { pollMs, enabled = true }: Options = {}) {
    const [data, setData] = useState<T | null>(null)
    const [error, setError] = useState<ApiError | null>(null)
    const [loading, setLoading] = useState(Boolean(path && enabled))
    const requestId = useRef(0)

    const load = useCallback(
        async (background = false) => {
            if (!path || !enabled) return
            const id = ++requestId.current
            if (!background) setLoading(true)
            try {
                const result = await api.get<T>(path)
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
                if (id === requestId.current) setLoading(false)
            }
        },
        [path, enabled],
    )

    useEffect(() => {
        load()
    }, [load])

    useEffect(() => {
        if (!pollMs || !path || !enabled) return
        const timer = window.setInterval(() => {
            if (document.visibilityState === 'visible') load(true)
        }, pollMs)
        return () => window.clearInterval(timer)
    }, [pollMs, path, enabled, load])

    const reload = useCallback(() => load(true), [load])

    return { data, error, loading, reload, setData }
}
