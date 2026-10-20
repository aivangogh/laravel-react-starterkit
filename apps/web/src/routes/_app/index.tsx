import { createFileRoute } from '@tanstack/react-router'
import { Home } from 'lucide-react'
import { HomePage } from '@/features/home/pages/HomePage'

// No `permission` → the nav item is always visible. Auth is enforced by the `_app` shell.
export const Route = createFileRoute('/_app/')({
  staticData: { nav: { title: 'Home', icon: Home, order: 0 } },
  component: HomePage,
})
