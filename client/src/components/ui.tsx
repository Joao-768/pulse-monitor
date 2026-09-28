import {
    forwardRef,
    type ButtonHTMLAttributes,
    type InputHTMLAttributes,
    type ReactNode,
} from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { buttonClass, type Size, type Variant } from '@/components/button-class'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant
    size?: Size
    busy?: boolean
}

export function Button({
    variant,
    size,
    busy,
    className,
    children,
    disabled,
    ...props
}: ButtonProps) {
    return (
        <button
            className={buttonClass(variant, size, className)}
            disabled={disabled || busy}
            aria-busy={busy || undefined}
            {...props}
        >
            {busy ? <Spinner /> : null}
            {children}
        </button>
    )
}

export function ButtonLink({
    variant,
    size,
    className,
    ...props
}: LinkProps & { variant?: Variant; size?: Size }) {
    return <Link className={buttonClass(variant, size, className)} {...props} />
}

export function Spinner({ className }: { className?: string }) {
    return (
        <span
            aria-hidden="true"
            className={cn(
                'inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent',
                className,
            )}
        />
    )
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string
    error?: string
    hint?: ReactNode
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
    { label, error, hint, id, className, ...props },
    ref,
) {
    const inputId = id ?? props.name
    return (
        <div className={className}>
            <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-medium text-ink-2">
                {label}
            </label>
            <input
                ref={ref}
                id={inputId}
                className="field"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${inputId}-error` : undefined}
                {...props}
            />
            {error ? (
                <p id={`${inputId}-error`} className="mt-1.5 text-[13px] text-down">
                    {error}
                </p>
            ) : hint ? (
                <p className="mt-1.5 text-[13px] text-ink-3">{hint}</p>
            ) : null}
        </div>
    )
})

export function Alert({
    tone = 'error',
    children,
}: {
    tone?: 'error' | 'info'
    children: ReactNode
}) {
    return (
        <div
            role={tone === 'error' ? 'alert' : 'status'}
            className={cn(
                'rounded-md border px-3.5 py-2.5 text-sm',
                tone === 'error'
                    ? 'border-down/30 bg-down-soft text-down-text'
                    : 'border-signal/25 bg-signal-soft text-signal-text',
            )}
        >
            {children}
        </div>
    )
}

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
    return (
        <section className={cn('rounded-lg border border-rule bg-surface', className)}>
            {children}
        </section>
    )
}

export function PanelHeader({
    title,
    description,
    actions,
}: {
    title: string
    description?: ReactNode
    actions?: ReactNode
}) {
    return (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-rule px-5 py-4">
            <div>
                <h2 className="text-[15px] font-semibold">{title}</h2>
                {description ? (
                    <p className="mt-0.5 text-[13px] text-ink-3">{description}</p>
                ) : null}
            </div>
            {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
    )
}

export function Skeleton({ className }: { className?: string }) {
    return <div className={cn('animate-pulse rounded bg-grid', className)} />
}
