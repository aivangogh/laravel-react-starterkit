import { createFileRoute } from '@tanstack/react-router'
import { KeyRound } from 'lucide-react'
import { TokensPage } from '@/features/tokens/pages/TokensPage'

// Self-service — no `permission`, so every authenticated user manages their own tokens and the
// nav item is always visible.
export const Route = createFileRoute('/_app/tokens')({
  staticData: { nav: { title: 'API Tokens', icon: KeyRound, order: 110 } },
  component: TokensPage,
})
