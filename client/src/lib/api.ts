// Thin fetch wrapper. The session lives in an httpOnly cookie, so requests
// only need `credentials: 'include'`; the client never touches the token.

// Production: https://api.joao-caetano.com/pulse (.env.production), a different
// origin on the same site, so the session cookie still travels. Development:
// empty, and the Vite dev server proxies /api.
export const API_BASE: string = import.meta.env.VITE_API_URL ?? ''

export class ApiError extends Error {
    status: number
    code: string
    details?: Record<string, string>

    constructor(status: number, code: string, message: string, details?: Record<string, string>) {
        super(message)
        this.status = status
        this.code = code
        this.details = details
    }
}

type Listener = () => void
const unauthorizedListeners = new Set<Listener>()

// The auth layer subscribes so an expired session anywhere sends the user to login.
export function onUnauthorized(listener: Listener) {
    unauthorizedListeners.add(listener)
    return () => unauthorizedListeners.delete(listener)
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    let response: Response
    try {
        response = await fetch(`${API_BASE}/api${path}`, {
            method,
            credentials: 'include',
            headers: body === undefined ? undefined : { 'content-type': 'application/json' },
            body: body === undefined ? undefined : JSON.stringify(body),
        })
    } catch {
        throw new ApiError(
            0,
            'NETWORK',
            'Cannot reach Pulse Monitor. Check your connection and try again.',
        )
    }

    if (response.status === 204) return undefined as T

    const data = await response.json().catch(() => null)
    if (!response.ok) {
        const error = data?.error
        if (response.status === 401 && !path.startsWith('/auth/')) {
            unauthorizedListeners.forEach((listener) => listener())
        }
        throw new ApiError(
            response.status,
            error?.code ?? 'UNKNOWN',
            error?.message ?? 'Something went wrong. Try again.',
            error?.details,
        )
    }
    return data as T
}

export const api = {
    get: <T>(path: string) => request<T>('GET', path),
    post: <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
    patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
    delete: <T>(path: string) => request<T>('DELETE', path),
}
