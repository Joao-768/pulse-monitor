// Theme preference: dark by default; 'light' overrides it and 'system' follows the OS.
// public/theme.js applies the saved choice before React loads; this module
// keeps it in sync afterwards.

export type ThemeMode = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'pm-theme'
const media = window.matchMedia('(prefers-color-scheme: dark)')

export function readThemeMode(): ThemeMode {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        // Dark is the default; light and system are explicit choices.
        return saved === 'light' || saved === 'system' ? saved : 'dark'
    } catch {
        return 'dark'
    }
}

function apply(mode: ThemeMode) {
    const dark = mode === 'dark' || (mode === 'system' && media.matches)
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
}

export function setThemeMode(mode: ThemeMode) {
    try {
        localStorage.setItem(STORAGE_KEY, mode)
    } catch {
        // Storage unavailable (private mode): the choice lasts for this page only.
    }
    apply(mode)
}

// Follow OS changes while the preference is "system".
media.addEventListener('change', () => {
    if (readThemeMode() === 'system') apply('system')
})
