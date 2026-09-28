// Guards against blaming monitored sites for our own outage.
//
// If the checker loses its network (host sleep, DNS resolver down, cloud
// network blip), every check fails with DNS or connection errors and every
// monitor would go DOWN at once. Before a network-level failure is recorded,
// we confirm that the checker itself can reach the internet. If it cannot,
// the result is discarded and the monitor keeps its state.

import { lookup } from 'node:dns/promises'
import { MONITORING } from '../config/monitoring.js'
import { logger } from '../utils/logger.js'

// Failures that can be caused by the checker's own network.
const NETWORK_LEVEL = new Set([
    'DNS',
    'TIMEOUT',
    'CONNECTION_REFUSED',
    'CONNECTION_RESET',
    'NETWORK',
])

const CACHE_MS = 15_000
let cached = null

async function probe() {
    // Online if either DNS resolution or a direct request to a well-known
    // address works. Two independent paths avoid false "offline" verdicts.
    const dnsProbe = Promise.any(MONITORING.canaryHosts.map((host) => lookup(host)))
    const httpProbe = fetch(MONITORING.canaryUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(4000),
    }).then((response) => response.body?.cancel())

    try {
        await Promise.any([dnsProbe, httpProbe])
        return true
    } catch {
        return false
    }
}

export async function checkerIsOnline() {
    if (cached && Date.now() - cached.at < CACHE_MS) return cached.online
    const online = await probe()
    if (cached?.online !== online) {
        logger[online ? 'info' : 'warn'](
            online
                ? 'Checker connectivity restored'
                : 'Checker is offline; failed checks are discarded',
        )
    }
    cached = { online, at: Date.now() }
    return online
}

export function isNetworkLevelFailure(result) {
    return !result.success && NETWORK_LEVEL.has(result.errorType)
}
