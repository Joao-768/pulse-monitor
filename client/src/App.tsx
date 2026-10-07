import { Suspense, lazy } from 'react'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/auth/auth-provider'
import { GuestOnly, RequireAuth } from '@/auth/guards'
import { AppShell } from '@/components/app-shell'
import { Logo } from '@/components/logo'
import { ToastProvider } from '@/components/toast'
import { buttonClass } from '@/components/button-class'
import { Spinner } from '@/components/ui'
import { ForgotPasswordPage, LoginPage, RegisterPage, ResetPasswordPage } from '@/pages/auth-pages'

// Split by area so visitors do not download the app, and vice versa.
const LandingPage = lazy(() => import('@/pages/landing').then((m) => ({ default: m.LandingPage })))
const PricingPage = lazy(() => import('@/pages/landing').then((m) => ({ default: m.PricingPage })))
const DashboardPage = lazy(() =>
    import('@/pages/dashboard').then((m) => ({ default: m.DashboardPage })),
)
const MonitorDetailPage = lazy(() =>
    import('@/pages/monitor-detail').then((m) => ({ default: m.MonitorDetailPage })),
)
const IncidentsPage = lazy(() =>
    import('@/pages/incidents').then((m) => ({ default: m.IncidentsPage })),
)
const NotificationsPage = lazy(() =>
    import('@/pages/notifications').then((m) => ({ default: m.NotificationsPage })),
)

function PageFallback() {
    return (
        <div className="flex min-h-[50vh] items-center justify-center text-ink-3">
            <Spinner className="h-5 w-5" />
        </div>
    )
}

function NotFoundPage() {
    return (
        <div className="graph-paper flex min-h-svh flex-col items-center justify-center px-4 text-center">
            <Logo />
            <p className="eyebrow mt-10">404</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
                This page does not exist
            </h1>
            <p className="mt-2 text-ink-2">The link may be old, or the address has a typo.</p>
            <Link to="/" className={buttonClass('secondary', 'md', 'mt-8')}>
                Go to the home page
            </Link>
        </div>
    )
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ToastProvider>
                    <Suspense fallback={<PageFallback />}>
                        <Routes>
                            <Route path="/" element={<LandingPage />} />
                            <Route path="/pricing" element={<PricingPage />} />
                            <Route path="/reset-password" element={<ResetPasswordPage />} />
                            <Route element={<GuestOnly />}>
                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/register" element={<RegisterPage />} />
                                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                            </Route>
                            <Route element={<RequireAuth />}>
                                <Route path="/app" element={<AppShell />}>
                                    <Route index element={<DashboardPage />} />
                                    <Route path="monitors/:id" element={<MonitorDetailPage />} />
                                    <Route path="incidents" element={<IncidentsPage />} />
                                    <Route path="notifications" element={<NotificationsPage />} />
                                </Route>
                            </Route>
                            <Route path="*" element={<NotFoundPage />} />
                        </Routes>
                    </Suspense>
                </ToastProvider>
            </AuthProvider>
        </BrowserRouter>
    )
}
