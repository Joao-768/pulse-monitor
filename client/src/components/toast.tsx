import { useCallback, useState, type ReactNode } from 'react'
import { ToastContext, type Tone } from '@/components/toast-context'
import { cn } from '@/lib/utils'

interface Toast {
    id: number
    message: string
    tone: Tone
}

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
                            'pointer-events-auto flex items-center gap-3 rounded-md px-4 py-2.5 text-sm shadow-lg',
                            toast.tone === 'error'
                                ? 'bg-danger text-danger-fg'
                                : 'bg-primary text-primary-fg',
                        )}
                    >
                        <span
                            className={cn(
                                'h-1.5 w-1.5 rounded-full',
                                toast.tone === 'error' ? 'bg-danger-fg' : 'bg-up',
                            )}
                        />
                        {toast.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}
