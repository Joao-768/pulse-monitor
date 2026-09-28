import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/auth/auth-context'
import { Logo } from '@/components/logo'
import { useApi } from '@/hooks/use-api'
import { cn } from '@/lib/utils'

export const NOTIFICATIONS_CHANGED = 'pulse:notifications-changed'

function NavItem({ to, children, end }: { to: string; children: React.ReactNode; end?: boolean }) {
    return (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
                cn(
                    'relative flex h-full items-center px-1 text-sm transition-colors',
                    isActive
                        ? 'text-white after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:bg-white'
                        : 'text-white/60 hover:text-white',
                )
            }
        >
            {children}
        </NavLink>
    )
}

export function AppShell() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [loggingOut, setLoggingOut] = useState(false)
    const unread = useApi<{ unread: number }>('/notifications/unread-count', { pollMs: 20_000 })
    const reloadUnread = unread.reload

    useEffect(() => {
        window.addEventListener(NOTIFICATIONS_CHANGED, reloadUnread)
        return () => window.removeEventListener(NOTIFICATIONS_CHANGED, reloadUnread)
    }, [reloadUnread])

    async function handleLogout() {
        setLoggingOut(true)
        try {
            // Leave the protected area first, or the auth guard would send us to /login.
            navigate('/', { replace: true })
            await logout()
        } finally {
            setLoggingOut(false)
        }
    }

    const unreadCount = unread.data?.unread ?? 0

    return (
        <div className="min-h-svh">
            {/* One row from sm up; on phones the tabs drop to a second row. */}
            <header className="sticky top-0 z-30 bg-ink">
                <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 px-4 sm:h-14 sm:flex-nowrap sm:px-6">
                    <NavLink
                        to="/app"
                        aria-label="Pulse Monitor dashboard"
                        className="flex h-14 shrink-0 items-center"
                    >
                        <Logo inverted />
                    </NavLink>
                    <nav
                        className="order-last -mx-4 flex h-11 w-[calc(100%+2rem)] items-center gap-5 overflow-x-auto border-t border-white/10 px-4 sm:order-none sm:mx-0 sm:h-full sm:w-auto sm:border-t-0 sm:px-0"
                        aria-label="Main"
                    >
                        <NavItem to="/app" end>
                            Dashboard
                        </NavItem>
                        <NavItem to="/app/incidents">Incidents</NavItem>
                        <NavItem to="/app/notifications">
                            Notifications
                            {unreadCount > 0 ? (
                                <span className="ml-1.5 rounded-full bg-down px-1.5 py-px font-mono text-[10px] font-semibold text-white">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            ) : null}
                        </NavItem>
                    </nav>
                    <div className="ml-auto flex shrink-0 items-center gap-3">
                        <div className="hidden text-right leading-tight md:block">
                            <div className="max-w-[16rem] truncate text-[13px] text-white/85">
                                {user?.email}
                            </div>
                            <div className="font-mono text-[10px] tracking-[0.08em] text-white/45 uppercase">
                                {user?.plan.name} plan
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="flex h-8 items-center gap-1.5 rounded-md px-2 text-[13px] text-white/70 hover:bg-white/10 hover:text-white"
                        >
                            <LogOut size={15} aria-hidden="true" />
                            <span className="hidden sm:inline">Log out</span>
                        </button>
                    </div>
                </div>
            </header>
            <main className="mx-auto max-w-7xl px-4 pt-6 pb-16 sm:px-6 sm:pt-8">
                <Outlet />
            </main>
        </div>
    )
}
