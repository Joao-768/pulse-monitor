// Theme preference: 'system' follows the OS, 'light' and 'dark' override it.
// public/theme.js applies the saved choice before React loads; this module
// keeps it in sync afterwards.

export type ThemeMode = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'pm-theme'
const media = window.matchMedia('(prefers-color-scheme: dark)')

export function readThemeMode(): ThemeMode {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        return saved === 'light' || saved === 'dark' ? saved : 'system'
    } catch {
        return 'system'
    }
}

function apply(mode: ThemeMode) {
    const dark = mode === 'dark' || (mode === 'system' && media.matches)
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
}

export function setThemeMode(mode: ThemeMode) {
    try {
        if (mode === 'system') localStorage.removeItem(STORAGE_KEY)
        else localStorage.setItem(STORAGE_KEY, mode)
    } catch {
        // Storage unavailable (private mode): the choice lasts for this page only.
    }
    apply(mode)
}

// Follow OS changes while the preference is "system".
media.addEventListener('change', () => {
    if (readThemeMode() === 'system') apply('system')
})
