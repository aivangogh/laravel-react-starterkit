import { useState, type FormEvent } from 'react'
import { Check, Copy, Plus } from 'lucide-react'
import type { NewApiToken } from '@app/types'
import { Alert, AlertDescription } from '@app/ui/components/ui/alert'
import { Button } from '@app/ui/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@app/ui/components/ui/dialog'
import { Input } from '@app/ui/components/ui/input'
import { FormField } from '@/shared/components/FormField'
import { formErrors, formValues } from '@/shared/lib/form'
import { useTokens } from '@/features/tokens/hooks/useTokens'

/** Split the comma-separated abilities field into a list; `undefined` grants full access. */
function parseAbilities(value: string): string[] | undefined {
  const list = value
    .split(',')
    .map((ability) => ability.trim())
    .filter(Boolean)
  return list.length ? list : undefined
}

/**
 * "Create token" button + dialog. The body lives inside `DialogContent`, which Base UI unmounts
 * while closed — so every open starts fresh and the one-time secret is dropped on close.
 */
export function CreateTokenDialog() {
  return (
    <Dialog>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="size-4" />
        Create token
      </DialogTrigger>
      <DialogContent>
        <CreateTokenDialogBody />
      </DialogContent>
    </Dialog>
  )
}

function CreateTokenDialogBody() {
  const { createMutation } = useTokens()
  // The one-time secret returned by the API. While set, the dialog shows the "copy it now" view.
  const [createdToken, setCreatedToken] = useState<NewApiToken | null>(null)
  const [copied, setCopied] = useState(false)
  const errors = formErrors(createMutation.error)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = formValues(event.currentTarget)
    createMutation.mutate(
      { name: values.name ?? '', abilities: parseAbilities(values.abilities ?? '') },
      { onSuccess: setCreatedToken },
    )
  }

  async function copyToken() {
    if (!createdToken) return
    await navigator.clipboard.writeText(createdToken.plain_text_token)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  // Success view: the plaintext secret, shown exactly once.
  if (createdToken) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Token created</DialogTitle>
          <DialogDescription>Copy your new token — it won't be shown again.</DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertDescription>
            Make sure to copy your token now. For security, you won't be able to see it again.
          </AlertDescription>
        </Alert>

        <FormField
          label="Token"
          htmlFor="plain-token"
          hint={copied ? 'Copied to clipboard.' : undefined}
        >
          <div className="flex items-center gap-2">
            <Input
              id="plain-token"
              value={createdToken.plain_text_token}
              readOnly
              className="font-mono text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Copy token"
              onClick={copyToken}
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </Button>
          </div>
        </FormField>

        <DialogFooter>
          <DialogClose render={<Button type="button" />}>Done</DialogClose>
        </DialogFooter>
      </>
    )
  }

  return (
    <form noValidate onSubmit={onSubmit}>
      <DialogHeader>
        <DialogTitle>Create API token</DialogTitle>
        <DialogDescription>Give your token a name to remember where it's used.</DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {errors.alert && (
          <Alert variant="destructive">
            <AlertDescription>{errors.alert}</AlertDescription>
          </Alert>
        )}

        <FormField label="Name" htmlFor="token-name" error={errors.fields.name}>
          <Input
            id="token-name"
            name="name"
            placeholder="e.g. CI deploy"
            required
            aria-invalid={!!errors.fields.name || undefined}
          />
        </FormField>

        <FormField
          label={
            <>
              Abilities <span className="text-muted-foreground font-normal">(optional)</span>
            </>
          }
          htmlFor="token-abilities"
          hint="Comma-separated. Leave blank to grant full access."
          error={errors.fields.abilities}
        >
          <Input
            id="token-abilities"
            name="abilities"
            placeholder="read, write"
            aria-invalid={!!errors.fields.abilities || undefined}
          />
        </FormField>
      </div>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Creating…' : 'Create token'}
        </Button>
      </DialogFooter>
    </form>
  )
}
