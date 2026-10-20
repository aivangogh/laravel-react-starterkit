import type { ReactNode } from 'react'
import { cn } from '@app/ui/lib/utils'

/** Centered single-card shell for the public auth pages. */
export function AuthLayout({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <main className="bg-muted/40 flex min-h-screen items-center justify-center p-4">
      <div className={cn('w-full max-w-sm', className)}>{children}</div>
    </main>
  )
}
