import { Fragment } from 'react'
import { Badge } from '@app/ui/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@app/ui/components/ui/dialog'
import { Skeleton } from '@app/ui/components/ui/skeleton'
import { useActivityDetail } from '@/features/activity/hooks/useActivity'
import { causerLabel, formatActivityDate, modelBasename } from '@/features/activity/lib/format'

/**
 * Read-only detail view for one activity-log entry. The body lives inside `DialogContent`, which
 * Base UI unmounts while closed — so the entry is only fetched while the dialog is open.
 */
export function ActivityDetailDialog({
  id,
  open,
  onOpenChange,
}: {
  /** The activity id to show, or `null` when nothing is selected. */
  id: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] overflow-y-auto sm:max-w-lg"
        data-slot="activity-detail"
      >
        <ActivityDetailBody id={id} />
      </DialogContent>
    </Dialog>
  )
}

function ActivityDetailBody({ id }: { id: number | null }) {
  const { data: activity, isLoading, isError } = useActivityDetail(id)

  // Scalar metadata rendered as a key/value grid.
  const metaRows = activity
    ? [
        { label: 'Event', value: activity.event ?? activity.log_name ?? '—' },
        { label: 'Log name', value: activity.log_name ?? '—' },
        { label: 'Causer', value: causerLabel(activity) },
        {
          label: 'Subject',
          value: activity.subject_id
            ? `${modelBasename(activity.subject_type) ?? 'Record'} #${activity.subject_id}`
            : (modelBasename(activity.subject_type) ?? '—'),
        },
        { label: 'Date', value: formatActivityDate(activity.created_at) },
      ]
    : []

  // JSON blocks shown for the free-form payloads (may be absent).
  const jsonSections = activity
    ? [
        { label: 'Attribute changes', value: activity.attribute_changes },
        { label: 'Properties', value: activity.properties },
      ].filter((section): section is { label: string; value: Record<string, unknown> } => {
        return section.value != null && Object.keys(section.value).length > 0
      })
    : []

  return (
    <>
      <DialogHeader>
        <DialogTitle>Activity detail</DialogTitle>
        <DialogDescription>
          {activity?.description ?? 'The full record for this activity-log entry.'}
        </DialogDescription>
      </DialogHeader>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} className="h-6 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-destructive text-sm">Could not load this activity entry.</p>
      ) : activity ? (
        <div className="space-y-5 text-sm">
          <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2">
            {metaRows.map((row) => (
              <Fragment key={row.label}>
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd className="min-w-0 font-medium break-words">
                  {row.label === 'Event' ? (
                    <Badge variant="secondary">{row.value}</Badge>
                  ) : (
                    row.value
                  )}
                </dd>
              </Fragment>
            ))}
          </dl>

          {jsonSections.map((section) => (
            <section key={section.label} className="space-y-1.5">
              <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                {section.label}
              </h3>
              <pre className="bg-muted overflow-x-auto rounded-md p-3 text-xs">
                <code>{JSON.stringify(section.value, null, 2)}</code>
              </pre>
            </section>
          ))}

          {!jsonSections.length && (
            <p className="text-muted-foreground text-xs">
              No additional properties were recorded for this event.
            </p>
          )}
        </div>
      ) : null}
    </>
  )
}
