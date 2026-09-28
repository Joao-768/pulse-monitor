import { cn } from '@/lib/utils'

export type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
export type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
    primary: 'bg-ink text-white hover:bg-[#1d2a3a] disabled:bg-ink-3',
    secondary:
        'bg-surface text-ink border border-rule-strong hover:border-ink-3 hover:bg-paper disabled:text-ink-3',
    danger: 'bg-down text-white hover:bg-[#bf2d32] disabled:opacity-60',
    ghost: 'text-ink-2 hover:text-ink hover:bg-ink/5',
}

const SIZES: Record<Size, string> = {
    sm: 'h-8 px-3 text-[13px] gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-12 px-5 text-[15px] gap-2',
}

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string) {
    return cn(
        'inline-flex shrink-0 items-center justify-center rounded-md font-medium whitespace-nowrap transition-colors',
        VARIANTS[variant],
        SIZES[size],
        className,
    )
}
