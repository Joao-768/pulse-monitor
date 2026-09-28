import { useEffect, useState } from 'react'

// Current time that re-renders every `intervalMs`, so live durations
// ("down for 2h 14m") tick without calling Date.now() during render.
export function useNow(intervalMs = 15_000) {
    const [now, setNow] = useState(() => Date.now())
    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), intervalMs)
        return () => window.clearInterval(timer)
    }, [intervalMs])
    return now
}
