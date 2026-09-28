import * as userRepository from '../repositories/user.repository.js'
import { SESSION_COOKIE, verifySessionToken } from '../services/session.service.js'
import { unauthorized } from '../utils/errors.js'

// Loads the session user into req.user, or answers 401.
export async function requireAuth(req, _res, next) {
    const token = req.cookies?.[SESSION_COOKIE]
    const payload = token ? verifySessionToken(token) : null
    if (!payload?.sub) throw unauthorized()

    const user = await userRepository.findById(payload.sub)
    if (!user) throw unauthorized()

    // Sessions issued before the last password change are no longer valid.
    const changedAtSeconds = Math.floor(new Date(user.password_changed_at).getTime() / 1000)
    if (payload.iat < changedAtSeconds) {
        throw unauthorized('Your session has ended. Log in again.')
    }

    req.user = user
    next()
}
