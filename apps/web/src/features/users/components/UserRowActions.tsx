import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@app/ui/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@app/ui/components/ui/dropdown-menu'
import { usePermissions } from '@/shared/hooks/usePermissions'

/**
 * Per-row actions menu for the users table. Items are gated by `users.update` / `users.delete`;
 * the component only reports intent — the page owns the dialogs.
 */
export function UserRowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const { can } = usePermissions()
  const canUpdate = can('users.update')
  const canDelete = can('users.delete')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label="Open actions menu" />}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          {canUpdate && (
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="size-4" />
              Edit
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        {canUpdate && canDelete && <DropdownMenuSeparator />}
        {canDelete && (
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
