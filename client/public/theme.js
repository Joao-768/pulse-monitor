// Runs before first paint (loaded synchronously in <head>) so the page never
// flashes the wrong theme. Kept as a file because the CSP forbids inline scripts.
;(function () {
    var mode = null
    try {
        mode = localStorage.getItem('pm-theme')
    } catch {
        mode = null
    }
    var dark =
        mode === 'dark' ||
        (mode !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
})()
