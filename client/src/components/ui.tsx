import {
    forwardRef,
    useState,
    type ButtonHTMLAttributes,
    type InputHTMLAttributes,
    type ReactNode,
} from 'react'
import { Eye, EyeOff } from 'lucide-react'
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

interface FieldFrameProps extends FieldProps {
    // Sits over the right edge of the input, e.g. a show-password button.
    trailing?: ReactNode
}

const FieldFrame = forwardRef<HTMLInputElement, FieldFrameProps>(function FieldFrame(
    { label, error, hint, trailing, id, className, ...props },
    ref,
) {
    const inputId = id ?? props.name
    return (
        <div className={className}>
            <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-medium text-ink-2">
                {label}
            </label>
            <div className="relative">
                <input
                    ref={ref}
                    id={inputId}
                    className={cn('field', trailing ? 'pr-11' : null)}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? `${inputId}-error` : undefined}
                    {...props}
                />
                {trailing}
            </div>
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

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(props, ref) {
    return <FieldFrame ref={ref} {...props} />
})

// A password input with an eye button that toggles the characters visible.
export const PasswordField = forwardRef<HTMLInputElement, Omit<FieldProps, 'type'>>(
    function PasswordField(props, ref) {
        const [visible, setVisible] = useState(false)
        const Icon = visible ? EyeOff : Eye
        return (
            <FieldFrame
                ref={ref}
                {...props}
                type={visible ? 'text' : 'password'}
                trailing={
                    <button
                        type="button"
                        onClick={() => setVisible((value) => !value)}
                        aria-label={visible ? 'Hide password' : 'Show password'}
                        aria-pressed={visible}
                        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-ink-3 transition-colors hover:text-ink"
                    >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                    </button>
                }
            />
        )
    },
)

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
