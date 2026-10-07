// Runs before first paint (loaded synchronously in <head>) so the page never
// flashes the wrong theme. Kept as a file because the CSP forbids inline scripts.
;(function () {
    var mode = null
    try {
        mode = localStorage.getItem('pm-theme')
    } catch {
        mode = null
    }
    // Dark unless the visitor chose light, or chose to follow the system.
    var dark =
        mode === 'system'
            ? window.matchMedia('(prefers-color-scheme: dark)').matches
            : mode !== 'light'
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
})()
