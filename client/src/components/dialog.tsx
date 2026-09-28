import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

// Native <dialog>: focus trapping, Escape to close and the backdrop come
// from the browser.
export function Dialog({
    open,
    onClose,
    title,
    description,
    children,
}: {
    open: boolean
    onClose: () => void
    title: string
    description?: ReactNode
    children: ReactNode
}) {
    const ref = useRef<HTMLDialogElement>(null)

    useEffect(() => {
        const dialog = ref.current
        if (!dialog) return
        if (open && !dialog.open) dialog.showModal()
        if (!open && dialog.open) dialog.close()
    }, [open])

    return (
        <dialog
            ref={ref}
            onClose={onClose}
            onCancel={(event) => {
                event.preventDefault()
                onClose()
            }}
            onClick={(event) => {
                if (event.target === ref.current) onClose()
            }}
            className="m-auto w-[min(100vw-2rem,30rem)] rounded-lg border border-rule bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/55"
        >
            {open ? (
                <div className="p-6">
                    <div className="mb-5 flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold tracking-[-0.01em]">{title}</h2>
                            {description ? (
                                <p className="mt-1 text-sm text-ink-2">{description}</p>
                            ) : null}
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="-mt-1 -mr-2 rounded p-1.5 text-ink-3 hover:bg-paper hover:text-ink"
                            aria-label="Close"
                        >
                            <X size={18} />
                        </button>
                    </div>
                    {children}
                </div>
            ) : null}
        </dialog>
    )
}
