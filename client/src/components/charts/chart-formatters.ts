export const shortDateFmt = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
})

export const weekdayDateFmt = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
})

export const hmsTimeFmt = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
})

// `Intl.NumberFormat.prototype.format` is a bound getter — safe to extract.
export const intFmt = new Intl.NumberFormat('en-US').format

// Pulse Monitor: time-of-day labels for short windows, where a day-only label
// would collapse every tick into the same date.
export const hourMinuteFmt = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
})

export const weekdayDateTimeFmt = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
})

const SHORT_SPAN_MS = 36 * 60 * 60 * 1000

export function axisDateFormatterForSpan(spanMs: number): Intl.DateTimeFormat {
    return spanMs <= SHORT_SPAN_MS ? hourMinuteFmt : shortDateFmt
}
