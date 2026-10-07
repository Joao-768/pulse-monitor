// API process. Also runs the check scheduler unless RUN_SCHEDULER=false.

import { createApp } from './app.js'
import { env } from './config/env.js'
import { migrate } from './db/migrate.js'
import { seedIfMissing } from './db/seed.js'
import { pool } from './db/pool.js'
import { startScheduler } from './monitoring/scheduler.js'
import { logger } from './utils/logger.js'

await migrate()
if (env.seedDemo && (await seedIfMissing())) {
    logger.info('Demo account created (SEED_DEMO)')
}

const app = createApp()
const server = app.listen(env.port, () => {
    logger.info('API listening', { port: env.port, env: env.nodeEnv })
})

const stopScheduler = env.runScheduler ? startScheduler() : null

let shuttingDown = false
async function shutdown(signal) {
    if (shuttingDown) return
    shuttingDown = true
    logger.info('Shutting down', { signal })
    server.close()
    if (stopScheduler) await stopScheduler()
    await pool.end()
    process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', { reason: String(reason) })
})
