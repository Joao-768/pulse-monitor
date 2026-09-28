// Integration: real PostgreSQL (DATABASE_URL) and real HTTP against a local
// test server. Uses a throwaway user that is removed afterwards.
process.env.ALLOW_PRIVATE_TARGETS = 'true'

import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { after, before, describe, test } from 'node:test'

const { migrate } = await import('../src/db/migrate.js')
const { pool, query } = await import('../src/db/pool.js')
const { performHttpCheck } = await import('../src/monitoring/http-check.js')
const { recordCheckResult } = await import('../src/monitoring/record-result.js')
const monitorService = await import('../src/services/monitor.service.js')
const authService = await import('../src/services/auth.service.js')

let server
let baseUrl
let mode = 'ok'
let user

before(async () => {
    await migrate()
    server = createServer((req, res) => {
        if (req.url === '/redirect') {
            res.writeHead(302, { location: '/ok' })
            return res.end()
        }
        if (req.url === '/slow') return setTimeout(() => res.end('late'), 2000)
        if (mode === 'down') {
            res.writeHead(503)
            return res.end('down')
        }
        res.end('ok')
    })
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    baseUrl = `http://127.0.0.1:${server.address().port}`
    await query("DELETE FROM users WHERE email = 'lifecycle-test@example.com'")
    user = await authService.register({
        email: 'lifecycle-test@example.com',
        password: 'test-password-1',
    })
})

after(async () => {
    await query('DELETE FROM users WHERE id = $1', [user.id])
    server.close()
    await pool.end()
})

async function check(monitorId, isRetry, url) {
    const result = await performHttpCheck(url)
    return recordCheckResult({ monitorId, isRetry, checkedAt: new Date(), result })
}

async function state(monitorId) {
    const { rows } = await query('SELECT status, retry_pending FROM monitors WHERE id = $1', [
        monitorId,
    ])
    return rows[0]
}

describe('HTTP checks', () => {
    test('success, redirects, HTTP errors, timeouts and refused connections', async () => {
        mode = 'ok'
        assert.equal((await performHttpCheck(`${baseUrl}/ok`)).success, true)
        assert.equal((await performHttpCheck(`${baseUrl}/redirect`)).statusCode, 200)

        mode = 'down'
        const down = await performHttpCheck(`${baseUrl}/ok`)
        assert.equal(down.errorType, 'HTTP_5XX')
        assert.equal(down.statusCode, 503)

        const slow = await performHttpCheck(`${baseUrl}/slow`, { timeoutMs: 300 })
        assert.equal(slow.errorType, 'TIMEOUT')

        // Grab a free port, then close it so nothing listens there.
        const probe = createServer()
        await new Promise((resolve) => probe.listen(0, '127.0.0.1', resolve))
        const closedPort = probe.address().port
        await new Promise((resolve) => probe.close(resolve))
        const refused = await performHttpCheck(`http://127.0.0.1:${closedPort}/`)
        assert.equal(refused.errorType, 'CONNECTION_REFUSED')
    })
})

describe('monitor lifecycle', () => {
    test('retry, incident, no duplicate incident, recovery, pause and resume', async () => {
        mode = 'ok'
        const url = `${baseUrl}/ok`
        const created = await monitorService.createMonitor(user.id, { name: 'Local', url })
        assert.equal(created.status, 'PENDING')
        // Let the immediate background check settle.
        await new Promise((resolve) => setTimeout(resolve, 300))
        assert.equal((await state(created.id)).status, 'UP')

        await assert.rejects(
            monitorService.createMonitor(user.id, { name: 'Again', url }),
            /already monitor/,
        )

        mode = 'down'
        await check(created.id, false, url)
        assert.deepEqual(await state(created.id), { status: 'UP', retry_pending: true })

        await check(created.id, true, url)
        assert.equal((await state(created.id)).status, 'DOWN')

        await check(created.id, false, url)
        await check(created.id, false, url)
        const incidents = await query('SELECT * FROM incidents WHERE monitor_id = $1', [created.id])
        assert.equal(incidents.rows.length, 1, 'still exactly one incident')
        assert.equal(incidents.rows[0].resolved_at, null)

        mode = 'ok'
        await check(created.id, false, url)
        assert.equal((await state(created.id)).status, 'UP')
        const resolved = await query(
            'SELECT resolved_at, resolution FROM incidents WHERE monitor_id = $1',
            [created.id],
        )
        assert.ok(resolved.rows[0].resolved_at)
        assert.equal(resolved.rows[0].resolution, 'RECOVERED')

        const notifications = await query(
            'SELECT type FROM notifications WHERE monitor_id = $1 ORDER BY created_at',
            [created.id],
        )
        assert.deepEqual(
            notifications.rows.map((row) => row.type),
            ['INCIDENT', 'RECOVERY'],
        )

        // A blip: normal check fails, retry succeeds, no incident.
        mode = 'down'
        await check(created.id, false, url)
        mode = 'ok'
        await check(created.id, true, url)
        const count = await query(
            'SELECT count(*)::int AS n FROM incidents WHERE monitor_id = $1',
            [created.id],
        )
        assert.equal(count.rows[0].n, 1)

        const paused = await monitorService.pauseMonitor(user.id, created.id)
        assert.equal(paused.status, 'PAUSED')
        const discarded = await check(created.id, false, url)
        assert.equal(discarded.discarded, 'paused', 'no checks recorded while paused')

        const resumed = await monitorService.resumeMonitor(user.id, created.id)
        assert.equal(resumed.status, 'PENDING')
        await new Promise((resolve) => setTimeout(resolve, 300))
        assert.equal((await state(created.id)).status, 'UP')

        const pauses = await query('SELECT resumed_at FROM monitor_pauses WHERE monitor_id = $1', [
            created.id,
        ])
        assert.equal(pauses.rows.length, 1)
        assert.ok(pauses.rows[0].resumed_at)
    })

    test('plan limit is enforced', async () => {
        const { rows } = await query('SELECT count(*)::int AS n FROM monitors WHERE user_id = $1', [
            user.id,
        ])
        for (let index = rows[0].n; index < 5; index++) {
            await monitorService.createMonitor(user.id, {
                name: `M${index}`,
                url: `${baseUrl}/ok?n=${index}`,
            })
        }
        await assert.rejects(
            monitorService.createMonitor(user.id, { name: 'Too many', url: `${baseUrl}/ok?n=99` }),
            (error) => error.code === 'PLAN_LIMIT_REACHED',
        )
        await new Promise((resolve) => setTimeout(resolve, 300))
    })

    test('another user cannot see the monitor', async () => {
        const { rows } = await query('SELECT id FROM monitors WHERE user_id = $1 LIMIT 1', [
            user.id,
        ])
        const stranger = '00000000-0000-4000-8000-000000000000'
        await assert.rejects(
            monitorService.getOwnedMonitor(stranger, rows[0].id),
            (error) => error.status === 404,
        )
    })
})
