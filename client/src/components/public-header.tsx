import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/auth-context'
import { Logo } from '@/components/logo'
import { ButtonLink } from '@/components/ui'

export function PublicHeader() {
    const { user } = useAuth()
    return (
        <header
            className="sticky top-0 z-30 border-b border-rule bg-paper/95 backdrop-blur-sm"
            style={{ height: 'var(--masthead-height)' }}
        >
            <div className="mx-auto flex h-full max-w-7xl items-center gap-8 px-4 sm:px-6">
                <Link to="/" aria-label="Pulse Monitor home">
                    <Logo />
                </Link>
                <nav
                    className="hidden items-center gap-6 text-sm text-ink-2 md:flex"
                    aria-label="Sections"
                >
                    <a href="/#how-it-works" className="hover:text-ink">
                        How it works
                    </a>
                    <a href="/#features" className="hover:text-ink">
                        Features
                    </a>
                    <Link to="/pricing" className="hover:text-ink">
                        Pricing
                    </Link>
                </nav>
                <div className="ml-auto flex items-center gap-2">
                    {user ? (
                        <ButtonLink to="/app" size="sm">
                            Open dashboard
                        </ButtonLink>
                    ) : (
                        <>
                            <ButtonLink to="/login" variant="ghost" size="sm">
                                Log in
                            </ButtonLink>
                            <ButtonLink to="/register" size="sm">
                                Start free
                            </ButtonLink>
                        </>
                    )}
                </div>
            </div>
        </header>
    )
}

export function PublicFooter() {
    return (
        <footer className="border-t border-rule">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-[13px] text-ink-3 sm:px-6">
                <Logo className="scale-90 origin-left" />
                <nav className="flex gap-5" aria-label="Footer">
                    <Link to="/pricing" className="hover:text-ink">
                        Pricing
                    </Link>
                    <Link to="/login" className="hover:text-ink">
                        Log in
                    </Link>
                    <Link to="/register" className="hover:text-ink">
                        Create account
                    </Link>
                </nav>
            </div>
        </footer>
    )
}
