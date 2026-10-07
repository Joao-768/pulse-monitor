import { createContext, useContext } from 'react'
import type { User } from '@/lib/types'

export interface AuthState {
    user: User | null
    // True until the first /auth/me answer, so guards do not flash.
    checking: boolean
    login: (email: string, password: string) => Promise<void>
    register: (email: string, password: string) => Promise<void>
    logout: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used inside AuthProvider')
    return context
}
