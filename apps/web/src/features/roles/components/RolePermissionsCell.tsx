import { Badge } from '@app/ui/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@app/ui/components/ui/tooltip'

/**
 * Renders a role's permission set compactly in a table cell: a count badge, the first few
 * permission names as badges, and a `+N` badge (with a tooltip listing the remainder) when there
 * are more than fit. Presentational — takes the permission names only.
 */
export function RolePermissionsCell({
  permissions,
  max = 3,
}: {
  permissions: string[]
  max?: number
}) {
  if (!permissions.length) return <span className="text-muted-foreground text-sm">None</span>

  const visible = permissions.slice(0, max)
  const overflow = permissions.slice(max)

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Badge variant="secondary">{permissions.length}</Badge>
      {visible.map((name) => (
        <Badge key={name} variant="outline" className="font-normal">
          {name}
        </Badge>
      ))}

      {overflow.length > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={<Badge variant="outline" className="cursor-default font-normal" />}
            >
              +{overflow.length}
            </TooltipTrigger>
            <TooltipContent>
              <ul className="space-y-0.5">
                {overflow.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}
