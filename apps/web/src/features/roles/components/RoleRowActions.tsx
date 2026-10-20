import { Ellipsis, Pencil, Trash2 } from 'lucide-react'
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
import { isSystemRole, type RoleRow } from '@/features/roles/hooks/useRoles'

/**
 * Per-row actions menu for the roles table. Gates Edit/Delete by the caller's permissions and
 * withholds Delete for protected system roles. Reports intent up to the page, which owns the
 * edit/delete dialogs — this component never mutates.
 */
export function RoleRowActions({
  role,
  onEdit,
  onDelete,
}: {
  role: RoleRow
  onEdit: () => void
  onDelete: () => void
}) {
  const { can } = usePermissions()
  const canEdit = can('roles.update')
  const canDelete = can('roles.delete') && !isSystemRole(role.name)

  return (
    <div className="text-right">
      {canEdit || canDelete ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${role.name}`} />
            }
          >
            <Ellipsis className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {canEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="size-4" />
                  Edit
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={onDelete}>
                  <Trash2 className="size-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      )}
    </div>
  )
}
