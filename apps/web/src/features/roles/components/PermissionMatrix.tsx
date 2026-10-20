import { useMemo } from 'react'
import type { Permission } from '@app/types'
import { Checkbox } from '@app/ui/components/ui/checkbox'
import { Label } from '@app/ui/components/ui/label'
import { Skeleton } from '@app/ui/components/ui/skeleton'
import { cn } from '@app/ui/lib/utils'

interface PermissionGroup {
  key: string
  label: string
  items: Permission[]
}

/** Group by the segment before the first dot; ungrouped names fall under "general". */
function groupPermissions(permissions: Permission[]): PermissionGroup[] {
  const byKey = new Map<string, Permission[]>()
  for (const permission of permissions) {
    const key = permission.name.includes('.') ? permission.name.split('.')[0] : 'general'
    const bucket = byKey.get(key)
    if (bucket) bucket.push(permission)
    else byKey.set(key, [permission])
  }
  return [...byKey.entries()]
    .map(([key, items]) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      items: [...items].sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

/** Label for a single checkbox: the action after the dot, or the full name when ungrouped. */
function actionLabel(name: string): string {
  return name.includes('.') ? name.slice(name.indexOf('.') + 1) : name
}

/**
 * Grouped permission picker. Presentational: it takes the full permission catalogue and the
 * currently-selected permission NAMES (`value`), groups the catalogue by the prefix before the
 * first `.` (e.g. `users.*`, `roles.*`) for readability, and reports the new selection via
 * `onChange` on every toggle. It never fetches — the parent form owns the catalogue query.
 */
export function PermissionMatrix({
  permissions,
  value,
  onChange,
  loading = false,
  invalid = false,
}: {
  permissions: Permission[]
  /** Selected permission names. */
  value: string[]
  onChange: (value: string[]) => void
  loading?: boolean
  /** Marks the whole field invalid (e.g. a 422 on `permissions`). */
  invalid?: boolean
}) {
  const groups = useMemo(() => groupPermissions(permissions), [permissions])
  const selected = new Set(value)

  /** Add or remove the given names from the selection. */
  function toggle(names: string[], checked: boolean): void {
    const next = new Set(value)
    for (const name of names) {
      if (checked) next.add(name)
      else next.delete(name)
    }
    onChange([...next])
  }

  return (
    <div
      data-slot="permission-matrix"
      className={cn('space-y-4', invalid && 'ring-destructive/40 rounded-md p-3 ring-1')}
    >
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-16 w-full" />
          ))}
        </div>
      ) : !groups.length ? (
        <p className="text-muted-foreground text-sm">No permissions available.</p>
      ) : (
        groups.map((group) => {
          // Tri-state for the group's master checkbox.
          const checkedCount = group.items.filter((p) => selected.has(p.name)).length
          return (
            <fieldset key={group.key} className="rounded-md border p-3">
              <div className="mb-2 flex items-center gap-2">
                <Checkbox
                  id={`perm-group-${group.key}`}
                  checked={checkedCount === group.items.length}
                  indeterminate={checkedCount > 0 && checkedCount < group.items.length}
                  onCheckedChange={(checked) =>
                    toggle(
                      group.items.map((p) => p.name),
                      checked,
                    )
                  }
                />
                <Label htmlFor={`perm-group-${group.key}`} className="text-sm font-semibold">
                  {group.label}
                </Label>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 pl-6 sm:grid-cols-3">
                {group.items.map((permission) => (
                  <div key={permission.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`perm-${permission.id}`}
                      checked={selected.has(permission.name)}
                      onCheckedChange={(checked) => toggle([permission.name], checked)}
                    />
                    <Label
                      htmlFor={`perm-${permission.id}`}
                      className="text-sm font-normal capitalize"
                    >
                      {actionLabel(permission.name)}
                    </Label>
                  </div>
                ))}
              </div>
            </fieldset>
          )
        })
      )}
    </div>
  )
}
