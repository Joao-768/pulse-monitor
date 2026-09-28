// Pure logic: no database, no network.
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { evaluateResponse, classifyNetworkError } from '../src/monitoring/evaluate.js'
import { isPrivateAddress } from '../src/monitoring/network-guard.js'
import { decideTransition } from '../src/monitoring/transitions.js'
import { computeAvailability, computeTimeline } from '../src/services/availability.js'
import { csvCell } from '../src/services/export.service.js'
import { resolvePeriod } from '../src/services/period.js'
import { formatDuration } from '../src/utils/duration.js'
import { normalizeMonitorUrl } from '../src/utils/url.js'

describe('URL validation', () => {
    test('rejects malformed URLs', () => {
        for (const input of [
            'google',
            'htp://example.com',
            'example.com',
            'http://',
            'https://localhost:3000',
            'ftp://example.com',
            'https://a:b@example.com',
        ]) {
            assert.ok(normalizeMonitorUrl(input).error, `${input} should be rejected`)
        }
    })

    test('accepts valid URLs, including ones that may be offline', () => {
        assert.equal(
            normalizeMonitorUrl('https://api.example.com/health').url,
            'https://api.example.com/health',
        )
        assert.equal(normalizeMonitorUrl('  HTTPS://Example.COM  ').url, 'https://example.com/')
        assert.equal(
            normalizeMonitorUrl('http://93.184.216.34:8080/x#frag').url,
            'http://93.184.216.34:8080/x',
        )
    })
})

describe('SSRF guard', () => {
    test('flags private, loopback, link-local and mapped addresses', () => {
        for (const address of [
            '127.0.0.1',
            '10.1.2.3',
            '172.20.0.1',
            '192.168.1.1',
            '169.254.169.254',
            '0.0.0.0',
            '::1',
            'fd00::1',
            'fe80::1',
            '::ffff:10.0.0.1',
        ]) {
            assert.equal(isPrivateAddress(address), true, address)
        }
    })

    test('allows public addresses', () => {
        for (const address of ['93.184.216.34', '1.1.1.1', '2606:4700:4700::1111']) {
            assert.equal(isPrivateAddress(address), false, address)
        }
    })
})

describe('response evaluation', () => {
    test('2xx and 3xx succeed, 4xx and 5xx fail with a category', () => {
        assert.equal(evaluateResponse({ statusCode: 200 }).success, true)
        assert.equal(evaluateResponse({ statusCode: 304 }).success, true)
        assert.deepEqual(evaluateResponse({ statusCode: 404 }), {
            success: false,
            errorType: 'HTTP_4XX',
            message: 'HTTP 404 Not Found',
        })
        assert.equal(evaluateResponse({ statusCode: 503 }).errorType, 'HTTP_5XX')
    })

    test('custom rules can extend success criteria', () => {
        const slow = ({ responseTime }) =>
            responseTime > 1000 ? { errorType: 'SLOW', message: 'Too slow' } : null
        assert.equal(
            evaluateResponse({ statusCode: 200, responseTime: 1500 }, [slow]).errorType,
            'SLOW',
        )
    })

    test('network errors are classified', () => {
        const fetchError = (code) =>
            Object.assign(new TypeError('fetch failed'), { cause: { code } })
        assert.equal(classifyNetworkError(fetchError('ENOTFOUND')).errorType, 'DNS')
        assert.equal(
            classifyNetworkError(fetchError('ECONNREFUSED')).errorType,
            'CONNECTION_REFUSED',
        )
        assert.equal(
            classifyNetworkError(Object.assign(new Error('x'), { name: 'TimeoutError' })).errorType,
            'TIMEOUT',
        )
        assert.equal(classifyNetworkError(fetchError('CERT_HAS_EXPIRED')).errorType, 'TLS')
    })
})

describe('state machine', () => {
    test('success always leads to UP and closes an incident only when DOWN', () => {
        assert.deepEqual(decideTransition('PENDING', true, false), {
            status: 'UP',
            retryPending: false,
            openIncident: false,
            closeIncident: false,
        })
        assert.equal(decideTransition('DOWN', true, false).closeIncident, true)
        assert.equal(decideTransition('UP', true, true).closeIncident, false)
    })

    test('first failure schedules a retry instead of going DOWN', () => {
        assert.deepEqual(decideTransition('UP', false, false), {
            status: 'UP',
            retryPending: true,
            openIncident: false,
            closeIncident: false,
        })
        assert.equal(decideTransition('PENDING', false, false).status, 'PENDING')
    })

    test('failed retry goes DOWN and opens an incident', () => {
        assert.deepEqual(decideTransition('UP', false, true), {
            status: 'DOWN',
            retryPending: false,
            openIncident: true,
            closeIncident: false,
        })
    })

    test('failures while DOWN neither retry nor open incidents', () => {
        assert.deepEqual(decideTransition('DOWN', false, false), {
            status: 'DOWN',
            retryPending: false,
            openIncident: false,
            closeIncident: false,
        })
    })
})

describe('availability', () => {
    const t = (hours) => new Date(Date.UTC(2026, 0, 1) + hours * 3600_000)

    test('downtime and pauses are clipped to the window; paused time is excluded', () => {
        const result = computeAvailability({
            from: t(0),
            to: t(10),
            createdAt: t(-100),
            pauses: [{ paused_at: t(2), resumed_at: t(4) }],
            incidents: [{ started_at: t(-1), resolved_at: t(1) }],
        })
        assert.equal(result.pausedMs, 2 * 3600_000)
        assert.equal(result.monitoredMs, 8 * 3600_000)
        assert.equal(result.downtimeMs, 1 * 3600_000)
        assert.equal(result.uptimePercent, 87.5)
    })

    test('window starts at creation and an open incident runs until now', () => {
        const result = computeAvailability({
            from: t(0),
            to: t(10),
            createdAt: t(6),
            pauses: [],
            incidents: [{ started_at: t(9), resolved_at: null }],
        })
        assert.equal(result.monitoredMs, 4 * 3600_000)
        assert.equal(result.uptimePercent, 75)
    })

    test('a fully paused window has no uptime value', () => {
        const result = computeAvailability({
            from: t(0),
            to: t(1),
            createdAt: t(-5),
            pauses: [{ paused_at: t(-1), resumed_at: null }],
            incidents: [],
        })
        assert.equal(result.uptimePercent, null)
    })

    test('timeline marks states per bucket', () => {
        const buckets = computeTimeline({
            from: t(0),
            to: t(4),
            bucketCount: 4,
            createdAt: t(1),
            pauses: [{ paused_at: t(3), resumed_at: null }],
            incidents: [{ started_at: t(2), resolved_at: t(2.5) }],
        })
        assert.deepEqual(
            buckets.map((bucket) => bucket.state),
            ['none', 'up', 'partial', 'paused'],
        )
    })
})

describe('periods', () => {
    const now = new Date('2026-09-28T12:00:00Z')

    test('Free plan clips 30d to its 7-day retention', () => {
        const period = resolvePeriod('30d', { plan: 'FREE', monitorCreatedAt: '2026-01-01', now })
        assert.equal(period.limitedByRetention, true)
        assert.equal(period.from.toISOString(), '2026-09-21T12:00:00.000Z')
    })

    test('"all" means everything the plan retains', () => {
        const period = resolvePeriod('all', { plan: 'PRO', monitorCreatedAt: '2026-01-01', now })
        assert.equal(period.from.toISOString(), '2026-06-30T12:00:00.000Z')
    })

    test('unknown periods are rejected', () => {
        assert.throws(() => resolvePeriod('1y', { plan: 'FREE', monitorCreatedAt: now, now }))
    })
})

describe('formatting', () => {
    test('durations', () => {
        assert.equal(formatDuration(45_000), '45s')
        assert.equal(formatDuration(7 * 60_000 + 5000), '7m 5s')
        assert.equal(formatDuration(2 * 3600_000 + 14 * 60_000), '2h 14m')
        assert.equal(formatDuration(3 * 86_400_000 + 4 * 3600_000), '3d 4h')
    })

    test('CSV cells are quoted and formula-safe', () => {
        assert.equal(csvCell('a,b'), '"a,b"')
        assert.equal(csvCell('say "hi"'), '"say ""hi"""')
        assert.equal(csvCell('=HYPERLINK("x")'), `"'=HYPERLINK(""x"")"`)
        assert.equal(csvCell(null), '')
    })
})
