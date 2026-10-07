import { createContext, useContext } from 'react'

export type Tone = 'neutral' | 'error'

export const ToastContext = createContext<((message: string, tone?: Tone) => void) | null>(null)

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) throw new Error('useToast must be used inside ToastProvider')
    return context
}
