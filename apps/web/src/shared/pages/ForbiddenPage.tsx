import { Link } from '@tanstack/react-router'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@app/ui/components/ui/button'

/**
 * 403 landing. The `_app` guard redirects here when an authenticated user hits a route whose
 * `staticData.permission` they don't hold. Rendered inside the DashboardLayout shell.
 */
export function ForbiddenPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <div className="bg-destructive/10 flex size-12 items-center justify-center rounded-full">
        <ShieldAlert className="text-destructive size-6" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Access denied</h1>
        <p className="text-muted-foreground text-sm">
          You don't have permission to view this page. If you think this is a mistake, contact an
          administrator.
        </p>
      </div>
      <Button variant="outline" render={<Link to="/" />} nativeButton={false}>
        Back to home
      </Button>
    </div>
  )
}
