import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'neutral' | 'error'
interface Toast {
    id: number
    message: string
    tone: Tone
}

const ToastContext = createContext<((message: string, tone?: Tone) => void) | null>(null)

let nextId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const show = useCallback((message: string, tone: Tone = 'neutral') => {
        const id = nextId++
        setToasts((current) => [...current.slice(-2), { id, message, tone }])
        window.setTimeout(() => {
            setToasts((current) => current.filter((toast) => toast.id !== id))
        }, 4200)
    }, [])

    return (
        <ToastContext.Provider value={show}>
            {children}
            <div
                aria-live="polite"
                className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
            >
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        role="status"
                        className={cn(
                            'pointer-events-auto flex items-center gap-3 rounded-md px-4 py-2.5 text-sm text-white shadow-lg',
                            toast.tone === 'error' ? 'bg-down' : 'bg-ink',
                        )}
                    >
                        <span
                            className={cn(
                                'h-1.5 w-1.5 rounded-full',
                                toast.tone === 'error' ? 'bg-white' : 'bg-up',
                            )}
                        />
                        {toast.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) throw new Error('useToast must be used inside ToastProvider')
    return context
}
