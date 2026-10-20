import { createFileRoute } from '@tanstack/react-router'
import { ForbiddenPage } from '@/shared/pages/ForbiddenPage'

export const Route = createFileRoute('/_app/forbidden')({
  component: ForbiddenPage,
})
