import { useState } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { readThemeMode, setThemeMode, type ThemeMode } from '@/lib/theme'
import { cn } from '@/lib/utils'

const NEXT: Record<ThemeMode, ThemeMode> = { dark: 'light', light: 'system', system: 'dark' }
const LABEL: Record<ThemeMode, string> = {
    system: 'Theme: follows your system',
    light: 'Theme: light',
    dark: 'Theme: dark',
}
const ICON = { system: Monitor, light: Sun, dark: Moon }

// One button that cycles dark, light and system. The title says the current mode.
export function ThemeToggle({ onDark = false }: { onDark?: boolean }) {
    const [mode, setMode] = useState<ThemeMode>(readThemeMode)
    const Icon = ICON[mode]

    return (
        <button
            type="button"
            onClick={() => {
                const next = NEXT[mode]
                setThemeMode(next)
                setMode(next)
            }}
            title={`${LABEL[mode]}. Click to change.`}
            aria-label={`${LABEL[mode]}. Change theme`}
            className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors',
                onDark
                    ? 'text-white/70 hover:bg-white/10 hover:text-white'
                    : 'text-ink-2 hover:bg-ink/5 hover:text-ink',
            )}
        >
            <Icon size={16} aria-hidden="true" />
        </button>
    )
}
