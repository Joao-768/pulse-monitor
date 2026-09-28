import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react'
import { api, onUnauthorized } from '@/lib/api'
import type { User } from '@/lib/types'

interface AuthState {
    user: User | null
    // True until the first /auth/me answer, so guards do not flash.
    checking: boolean
    login: (email: string, password: string) => Promise<void>
    register: (email: string, password: string) => Promise<void>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [checking, setChecking] = useState(true)

    useEffect(() => {
        api.get<{ user: User | null }>('/auth/me')
            .then(({ user }) => setUser(user))
            .catch(() => setUser(null))
            .finally(() => setChecking(false))
    }, [])

    useEffect(() => {
        const unsubscribe = onUnauthorized(() => setUser(null))
        return () => {
            unsubscribe()
        }
    }, [])

    const login = useCallback(async (email: string, password: string) => {
        const { user } = await api.post<{ user: User }>('/auth/login', { email, password })
        setUser(user)
    }, [])

    const register = useCallback(async (email: string, password: string) => {
        const { user } = await api.post<{ user: User }>('/auth/register', { email, password })
        setUser(user)
    }, [])

    const logout = useCallback(async () => {
        await api.post('/auth/logout')
        setUser(null)
    }, [])

    const value = useMemo(
        () => ({ user, checking, login, register, logout }),
        [user, checking, login, register, logout],
    )
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used inside AuthProvider')
    return context
}
