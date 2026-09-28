// Runs checks: HTTP request, then record the result. Knows nothing about
// *when* checks run; the cron scheduler (or a future queue worker) decides.

import { MONITORING } from '../config/monitoring.js'
import { logger } from '../utils/logger.js'
import { performHttpCheck } from './http-check.js'
import { recordCheckResult } from './record-result.js'

const inFlight = new Set()

export function inFlightCount() {
    return inFlight.size
}

export function availableSlots() {
    return Math.max(0, MONITORING.concurrency - inFlight.size)
}

// Executes one check for a monitor. Resolves when the result is stored.
// Errors are logged, never thrown: a failing check must not crash the loop.
export async function runCheck({ id, url, isRetry = false }) {
    if (inFlight.has(id)) return null
    inFlight.add(id)

    try {
        const checkedAt = new Date()
        const result = await performHttpCheck(url)
        logger.debug('Check finished', {
            monitorId: id,
            isRetry,
            success: result.success,
            statusCode: result.statusCode,
            responseTime: result.responseTime,
            error: result.errorMessage,
        })
        return await recordCheckResult({ monitorId: id, isRetry, checkedAt, result })
    } catch (error) {
        // Application error (database down, bug), not a monitored-site failure.
        logger.error('Check pipeline failed', { monitorId: id, error: error.message })
        return null
    } finally {
        inFlight.delete(id)
    }
}

// Fire-and-forget variant for "check right now" after create and resume.
export function runCheckInBackground(monitor) {
    runCheck(monitor).catch(() => {})
}

// Waits for in-flight checks during shutdown, up to a limit.
export async function drain(timeoutMs = 12_000) {
    const deadline = Date.now() + timeoutMs
    while (inFlight.size > 0 && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 100))
    }
}
