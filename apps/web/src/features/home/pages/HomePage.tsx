import { Button } from '@app/ui/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@app/ui/components/ui/card'
import { Can } from '@/shared/components/Can'
import { useUser } from '@/features/auth/hooks/useAuth'

export function HomePage() {
  const user = useUser()

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Welcome{user ? `, ${user.name}` : ''}</CardTitle>
          <CardDescription>You are signed in. This is a protected route.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          {/* Demonstrates <Can>: only rendered for users holding the permission. */}
          <Can permission="users.view">
            <Button variant="secondary">Manage users</Button>
          </Can>
        </CardContent>
      </Card>
    </div>
  )
}
