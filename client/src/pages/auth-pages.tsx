import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/auth/auth-context'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { Alert, Button, Field, Spinner } from '@/components/ui'
import { ApiError, api } from '@/lib/api'

function AuthLayout({
    title,
    subtitle,
    children,
    footer,
}: {
    title: string
    subtitle?: ReactNode
    children: ReactNode
    footer?: ReactNode
}) {
    return (
        <div className="graph-paper flex min-h-svh flex-col">
            <header className="flex items-center justify-between px-5 py-5 sm:px-8">
                <Link to="/" aria-label="Pulse Monitor home">
                    <Logo />
                </Link>
                <ThemeToggle />
            </header>
            <main className="flex flex-1 items-start justify-center px-4 pt-[6vh] pb-16">
                <div className="w-full max-w-[25rem]">
                    <div className="rounded-xl border border-rule bg-surface p-7 shadow-[0_1px_0_var(--rule),0_12px_32px_-16px_var(--shadow)] sm:p-8">
                        <h1 className="text-[22px] font-semibold tracking-[-0.02em]">{title}</h1>
                        {subtitle ? <p className="mt-1.5 text-sm text-ink-2">{subtitle}</p> : null}
                        <div className="mt-6">{children}</div>
                    </div>
                    {footer ? (
                        <div className="mt-5 text-center text-sm text-ink-2">{footer}</div>
                    ) : null}
                </div>
            </main>
        </div>
    )
}

function useFormState() {
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [formError, setFormError] = useState('')
    const [busy, setBusy] = useState(false)

    async function run(action: () => Promise<void>) {
        setBusy(true)
        setErrors({})
        setFormError('')
        try {
            await action()
        } catch (error) {
            if (error instanceof ApiError) {
                if (error.details) setErrors(error.details)
                if (!error.details || Object.keys(error.details).length === 0)
                    setFormError(error.message)
            } else {
                setFormError('Something went wrong. Try again.')
            }
        } finally {
            setBusy(false)
        }
    }

    return { errors, formError, busy, run }
}

export function LoginPage() {
    const { login } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const state = location.state as { from?: string; message?: string } | null
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const { formError, busy, run } = useFormState()

    function submit(event: FormEvent) {
        event.preventDefault()
        run(async () => {
            await login(email, password)
            navigate(state?.from?.startsWith('/app') ? state.from : '/app', { replace: true })
        })
    }

    return (
        <AuthLayout
            title="Log in"
            subtitle="Pick up where your monitors left off."
            footer={
                <>
                    No account yet?{' '}
                    <Link
                        to="/register"
                        className="font-medium text-ink underline decoration-rule-strong underline-offset-2 hover:decoration-ink"
                    >
                        Create one for free
                    </Link>
                </>
            }
        >
            <form onSubmit={submit} className="space-y-4" noValidate>
                {state?.message ? <Alert tone="info">{state.message}</Alert> : null}
                {formError ? <Alert>{formError}</Alert> : null}
                <Field
                    label="Email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoFocus
                    required
                />
                <div>
                    <Field
                        label="Password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                    />
                    <Link
                        to="/forgot-password"
                        className="mt-2 inline-block text-[13px] text-ink-2 hover:text-ink"
                    >
                        Forgot your password?
                    </Link>
                </div>
                <Button type="submit" size="lg" className="w-full" busy={busy}>
                    Log in
                </Button>
                {import.meta.env.DEV ? (
                    <p className="rounded-md bg-paper px-3 py-2 font-mono text-[11px] text-ink-3">
                        Local demo: demo@pulsemonitor.dev / pulse-demo-2026
                    </p>
                ) : null}
            </form>
        </AuthLayout>
    )
}

export function RegisterPage() {
    const { register } = useAuth()
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const { errors, formError, busy, run } = useFormState()

    function submit(event: FormEvent) {
        event.preventDefault()
        run(async () => {
            await register(email, password)
            navigate('/app', { replace: true })
        })
    }

    return (
        <AuthLayout
            title="Create your account"
            subtitle="Free plan: 5 monitors, checked every 5 minutes, with 7 days of history."
            footer={
                <>
                    Already have an account?{' '}
                    <Link
                        to="/login"
                        className="font-medium text-ink underline decoration-rule-strong underline-offset-2 hover:decoration-ink"
                    >
                        Log in
                    </Link>
                </>
            }
        >
            <form onSubmit={submit} className="space-y-4" noValidate>
                {formError ? (
                    <Alert>
                        {formError}{' '}
                        {formError.includes('Log in') ? (
                            <Link to="/login" className="font-medium underline">
                                Go to login
                            </Link>
                        ) : null}
                    </Alert>
                ) : null}
                <Field
                    label="Email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    error={errors.email}
                    autoFocus
                    required
                />
                <Field
                    label="Password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    error={errors.password}
                    hint="At least 8 characters."
                    required
                />
                <Button type="submit" size="lg" className="w-full" busy={busy}>
                    Create account
                </Button>
            </form>
        </AuthLayout>
    )
}

export function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [sent, setSent] = useState('')
    const { errors, formError, busy, run } = useFormState()

    function submit(event: FormEvent) {
        event.preventDefault()
        run(async () => {
            const result = await api.post<{ message: string }>('/auth/forgot-password', { email })
            setSent(result.message)
        })
    }

    return (
        <AuthLayout
            title="Reset your password"
            subtitle="Enter the email you signed up with. We send a link that works once, for 30 minutes."
            footer={
                <Link
                    to="/login"
                    className="font-medium text-ink underline decoration-rule-strong underline-offset-2 hover:decoration-ink"
                >
                    Back to login
                </Link>
            }
        >
            {sent ? (
                <div className="space-y-4">
                    <Alert tone="info">{sent}</Alert>
                    <p className="text-sm text-ink-2">
                        Nothing after a few minutes? Check spam, or{' '}
                        <button
                            type="button"
                            onClick={() => setSent('')}
                            className="font-medium text-ink underline decoration-rule-strong underline-offset-2 hover:decoration-ink"
                        >
                            try another email
                        </button>
                        .
                    </p>
                </div>
            ) : (
                <form onSubmit={submit} className="space-y-4" noValidate>
                    {formError ? <Alert>{formError}</Alert> : null}
                    <Field
                        label="Email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        error={errors.email}
                        autoFocus
                        required
                    />
                    <Button type="submit" size="lg" className="w-full" busy={busy}>
                        Send reset link
                    </Button>
                </form>
            )}
        </AuthLayout>
    )
}

export function ResetPasswordPage() {
    const [params] = useSearchParams()
    const navigate = useNavigate()
    const token = params.get('token') ?? ''
    const [valid, setValid] = useState<boolean | null>(token ? null : false)
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [mismatch, setMismatch] = useState('')
    const { errors, formError, busy, run } = useFormState()

    useEffect(() => {
        if (!token) return
        api.get<{ valid: boolean }>(
            `/auth/reset-password/validate?token=${encodeURIComponent(token)}`,
        )
            .then((result) => setValid(result.valid))
            .catch(() => setValid(false))
    }, [token])

    function submit(event: FormEvent) {
        event.preventDefault()
        if (password !== confirm) {
            setMismatch('The two passwords do not match.')
            return
        }
        setMismatch('')
        run(async () => {
            const result = await api.post<{ message: string }>('/auth/reset-password', {
                token,
                password,
            })
            navigate('/login', { replace: true, state: { message: result.message } })
        })
    }

    if (valid === null) {
        return (
            <AuthLayout title="Checking your link">
                <div className="flex justify-center py-4 text-ink-3">
                    <Spinner className="h-5 w-5" />
                </div>
            </AuthLayout>
        )
    }

    if (!valid) {
        return (
            <AuthLayout
                title="This link has expired"
                subtitle="Reset links work once and only for 30 minutes."
                footer={
                    <Link
                        to="/login"
                        className="font-medium text-ink underline decoration-rule-strong underline-offset-2 hover:decoration-ink"
                    >
                        Back to login
                    </Link>
                }
            >
                <Link
                    to="/forgot-password"
                    className="font-medium text-ink underline decoration-rule-strong underline-offset-2 hover:decoration-ink"
                >
                    Request a new link
                </Link>
            </AuthLayout>
        )
    }

    return (
        <AuthLayout
            title="Choose a new password"
            subtitle="You will be signed out everywhere else."
        >
            <form onSubmit={submit} className="space-y-4" noValidate>
                {formError ? (
                    <Alert>
                        {formError}{' '}
                        <Link to="/forgot-password" className="font-medium underline">
                            Request a new link
                        </Link>
                    </Alert>
                ) : null}
                <Field
                    label="New password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    error={errors.password}
                    hint="At least 8 characters."
                    autoFocus
                    required
                />
                <Field
                    label="Repeat new password"
                    name="confirm"
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                    error={mismatch}
                    required
                />
                <Button type="submit" size="lg" className="w-full" busy={busy}>
                    Save new password
                </Button>
            </form>
        </AuthLayout>
    )
}
