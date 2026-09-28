import { useState, type FormEvent } from 'react'
import { Dialog } from '@/components/dialog'
import { Alert, Button, Field } from '@/components/ui'
import { ApiError, api } from '@/lib/api'
import { formatInterval } from '@/lib/format'
import type { Monitor, Plan } from '@/lib/types'

export function CreateMonitorDialog({
    open,
    onClose,
    onCreated,
    plan,
    used,
}: {
    open: boolean
    onClose: () => void
    onCreated: (monitor: Monitor) => void
    plan: Plan
    used: number
}) {
    const [name, setName] = useState('')
    const [url, setUrl] = useState('https://')
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [formError, setFormError] = useState('')
    const [busy, setBusy] = useState(false)
    const atLimit = used >= plan.maxMonitors

    function close() {
        setName('')
        setUrl('https://')
        setErrors({})
        setFormError('')
        onClose()
    }

    async function submit(event: FormEvent) {
        event.preventDefault()
        setBusy(true)
        setErrors({})
        setFormError('')
        try {
            const { monitor } = await api.post<{ monitor: Monitor }>('/monitors', { name, url })
            onCreated(monitor)
            close()
        } catch (error) {
            if (error instanceof ApiError) {
                if (error.details) setErrors(error.details)
                if (error.code === 'DUPLICATE_URL') setErrors({ url: error.message })
                else if (!error.details) setFormError(error.message)
            }
        } finally {
            setBusy(false)
        }
    }

    return (
        <Dialog
            open={open}
            onClose={close}
            title="Add a monitor"
            description={`Checked every ${formatInterval(plan.checkIntervalSeconds)} on your ${plan.name} plan. ${used} of ${plan.maxMonitors} monitors used.`}
        >
            {atLimit ? (
                <div className="space-y-4">
                    <Alert>
                        Your {plan.name} plan allows {plan.maxMonitors} monitors. Delete a monitor
                        to add another. Paused monitors still count.
                    </Alert>
                    <div className="flex justify-end">
                        <Button variant="secondary" onClick={close}>
                            Close
                        </Button>
                    </div>
                </div>
            ) : (
                <form onSubmit={submit} className="space-y-4" noValidate>
                    {formError ? <Alert>{formError}</Alert> : null}
                    <Field
                        label="Name"
                        name="name"
                        placeholder="Checkout API"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        error={errors.name}
                        maxLength={80}
                        autoFocus
                        required
                    />
                    <Field
                        label="URL"
                        name="url"
                        type="url"
                        inputMode="url"
                        placeholder="https://api.example.com/health"
                        value={url}
                        onChange={(event) => setUrl(event.target.value)}
                        error={errors.url}
                        hint="Any public http:// or https:// address. It is checked right after you add it."
                        spellCheck={false}
                        autoCapitalize="off"
                        required
                    />
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="secondary" onClick={close}>
                            Cancel
                        </Button>
                        <Button type="submit" busy={busy}>
                            Add monitor
                        </Button>
                    </div>
                </form>
            )}
        </Dialog>
    )
}

export function RenameMonitorDialog({
    monitor,
    open,
    onClose,
    onRenamed,
}: {
    monitor: Monitor
    open: boolean
    onClose: () => void
    onRenamed: (monitor: Monitor) => void
}) {
    const [name, setName] = useState(monitor.name)
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    async function submit(event: FormEvent) {
        event.preventDefault()
        setBusy(true)
        setError('')
        try {
            const result = await api.patch<{ monitor: Monitor }>(`/monitors/${monitor.id}`, {
                name,
            })
            onRenamed(result.monitor)
            onClose()
        } catch (caught) {
            setError(caught instanceof ApiError ? caught.message : 'Could not rename the monitor.')
        } finally {
            setBusy(false)
        }
    }

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title="Rename monitor"
            description="The URL cannot change. To watch a different URL, add a new monitor."
        >
            <form onSubmit={submit} className="space-y-4" noValidate>
                <Field
                    label="Name"
                    name="rename"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    error={error}
                    maxLength={80}
                    autoFocus
                />
                <Field label="URL" name="url-readonly" value={monitor.url} readOnly />
                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" busy={busy}>
                        Save name
                    </Button>
                </div>
            </form>
        </Dialog>
    )
}

export function DeleteMonitorDialog({
    monitor,
    open,
    onClose,
    onDeleted,
}: {
    monitor: Monitor
    open: boolean
    onClose: () => void
    onDeleted: () => void
}) {
    const [confirmation, setConfirmation] = useState('')
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)
    const matches = confirmation.trim() === monitor.name.trim()

    async function submit(event: FormEvent) {
        event.preventDefault()
        if (!matches) return
        setBusy(true)
        setError('')
        try {
            await api.delete(`/monitors/${monitor.id}`)
            onDeleted()
        } catch (caught) {
            setError(caught instanceof ApiError ? caught.message : 'Could not delete the monitor.')
            setBusy(false)
        }
    }

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title="Delete this monitor?"
            description="Its checks, incidents and notifications are deleted with it. Adding the same URL later starts a new, empty history."
        >
            <form onSubmit={submit} className="space-y-4" noValidate>
                {error ? <Alert>{error}</Alert> : null}
                <Field
                    label={`Type "${monitor.name}" to confirm`}
                    name="confirm-delete"
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                    autoComplete="off"
                    autoFocus
                />
                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="danger" disabled={!matches} busy={busy}>
                        Delete monitor
                    </Button>
                </div>
            </form>
        </Dialog>
    )
}
