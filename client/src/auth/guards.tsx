import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/auth-context'
import { Spinner } from '@/components/ui'

function FullPageSpinner() {
    return (
        <div className="flex min-h-svh items-center justify-center text-ink-3">
            <Spinner className="h-5 w-5" />
        </div>
    )
}

// Only for logged-in users; everyone else goes to login and comes back after.
export function RequireAuth() {
    const { user, checking } = useAuth()
    const location = useLocation()
    if (checking) return <FullPageSpinner />
    if (!user) {
        return (
            <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
        )
    }
    return <Outlet />
}

// Login, register and password pages: a logged-in user goes to the app.
export function GuestOnly() {
    const { user, checking } = useAuth()
    if (checking) return <FullPageSpinner />
    if (user) return <Navigate to="/app" replace />
    return <Outlet />
}
