import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@app/ui/components/ui/dialog'
import type { RoleRow } from '@/features/roles/hooks/useRoles'
import { RoleForm } from '@/features/roles/components/RoleForm'

/**
 * Modal host for the create/edit role form. Thin shell: it owns open/close and the header copy, and
 * delegates all form state + mutations to `RoleForm`. Base UI unmounts `DialogContent` while
 * closed, so every open starts with fresh fields and no stale errors.
 */
export function RoleFormDialog({
  open,
  onOpenChange,
  role = null,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  role?: RoleRow | null
}) {
  const close = () => onOpenChange(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{role ? 'Edit role' : 'New role'}</DialogTitle>
          <DialogDescription>Name the role and choose the permissions it grants.</DialogDescription>
        </DialogHeader>

        <RoleForm key={role?.id ?? 'new'} role={role} onSaved={close} onCancel={close} />
      </DialogContent>
    </Dialog>
  )
}
