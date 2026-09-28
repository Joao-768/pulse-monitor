import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NOTIFICATIONS_CHANGED } from '@/components/app-shell'
import { useToast } from '@/components/toast'
import { Alert, Button, Skeleton } from '@/components/ui'
import { useApi } from '@/hooks/use-api'
import { ApiError, api } from '@/lib/api'
import { formatDateTime, formatRelative } from '@/lib/format'
import type { Notification, Page } from '@/lib/types'
import { cn } from '@/lib/utils'

type NotificationPage = Page<Notification> & { unread: number }

export function NotificationsPage() {
    const navigate = useNavigate()
    const toast = useToast()
    const [unreadOnly, setUnreadOnly] = useState(false)
    const [page, setPage] = useState(1)
    const [markingAll, setMarkingAll] = useState(false)
    const { data, error, loading, reload, setData } = useApi<NotificationPage>(
        `/notifications?page=${page}${unreadOnly ? '&unread=true' : ''}`,
        { pollMs: 20_000 },
    )
    const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1

    function announce() {
        window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED))
    }

    async function setRead(notification: Notification, isRead: boolean) {
        // Optimistic: flip it now, roll back if the request fails.
        setData((current) =>
            current
                ? {
                      ...current,
                      unread: current.unread + (isRead ? -1 : 1),
                      items: current.items.map((item) =>
                          item.id === notification.id ? { ...item, isRead } : item,
                      ),
                  }
                : current,
        )
        try {
            await api.patch(`/notifications/${notification.id}`, { isRead })
            announce()
        } catch (caught) {
            toast(
                caught instanceof ApiError ? caught.message : 'Could not update the notification.',
                'error',
            )
            reload()
        }
    }

    async function open(notification: Notification) {
        if (!notification.isRead) await setRead(notification, true)
        if (notification.monitorId) navigate(`/app/monitors/${notification.monitorId}`)
    }

    async function markAll() {
        setMarkingAll(true)
        try {
            await api.post('/notifications/read-all')
            announce()
            reload()
        } catch (caught) {
            toast(
                caught instanceof ApiError
                    ? caught.message
                    : 'Could not mark notifications as read.',
                'error',
            )
        } finally {
            setMarkingAll(false)
        }
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="eyebrow">{data ? `${data.unread} unread` : 'Inbox'}</p>
                    <h1 className="mt-1 text-[28px] font-semibold tracking-[-0.025em]">
                        Notifications
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <label className="flex cursor-pointer items-center gap-2 text-[13px] text-ink-2">
                        <input
                            type="checkbox"
                            checked={unreadOnly}
                            onChange={(event) => {
                                setUnreadOnly(event.target.checked)
                                setPage(1)
                            }}
                            className="h-4 w-4 accent-[var(--signal)]"
                        />
                        Unread only
                    </label>
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={markAll}
                        busy={markingAll}
                        disabled={!data || data.unread === 0}
                    >
                        Mark all as read
                    </Button>
                </div>
            </div>

            {error ? <Alert>{error.message}</Alert> : null}
            {!data && loading ? <Skeleton className="h-72" /> : null}

            {data ? (
                <section className="overflow-hidden rounded-lg border border-rule bg-surface">
                    {data.items.length === 0 ? (
                        <p className="px-5 py-14 text-center text-sm text-ink-3">
                            {unreadOnly
                                ? 'You are all caught up.'
                                : 'Notifications appear here when a monitor goes down or recovers.'}
                        </p>
                    ) : (
                        <ul className="divide-y divide-rule">
                            {data.items.map((notification) => (
                                <li
                                    key={notification.id}
                                    className={cn(
                                        'flex items-start gap-4 px-5 py-4',
                                        !notification.isRead && 'bg-signal-soft/40',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold',
                                            notification.type === 'INCIDENT'
                                                ? 'bg-down-soft text-down'
                                                : 'bg-up-soft text-up',
                                        )}
                                        aria-hidden="true"
                                    >
                                        {notification.type === 'INCIDENT' ? '↓' : '↑'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => open(notification)}
                                        disabled={!notification.monitorId && notification.isRead}
                                        className="min-w-0 flex-1 text-left disabled:cursor-default"
                                    >
                                        <p
                                            className={cn(
                                                'text-sm',
                                                !notification.isRead && 'font-medium',
                                            )}
                                        >
                                            {notification.message}
                                        </p>
                                        <p
                                            className="mt-1 font-mono text-[11px] text-ink-3"
                                            title={formatDateTime(notification.createdAt)}
                                        >
                                            {notification.type === 'INCIDENT'
                                                ? 'Incident'
                                                : 'Recovery'}{' '}
                                            · {formatRelative(notification.createdAt)}
                                            {notification.monitorId ? ' · open monitor →' : ''}
                                        </p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRead(notification, !notification.isRead)}
                                        className="shrink-0 rounded px-2 py-1 text-[12px] text-ink-3 hover:bg-paper hover:text-ink"
                                    >
                                        {notification.isRead ? 'Mark unread' : 'Mark read'}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                    {pages > 1 ? (
                        <footer className="flex items-center justify-between border-t border-rule px-5 py-3 text-[13px]">
                            <span className="font-mono text-ink-2">
                                Page {page} of {pages}
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    disabled={page <= 1}
                                    onClick={() => setPage(page - 1)}
                                >
                                    Newer
                                </Button>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    disabled={page >= pages}
                                    onClick={() => setPage(page + 1)}
                                >
                                    Older
                                </Button>
                            </div>
                        </footer>
                    ) : null}
                </section>
            ) : null}
        </div>
    )
}
