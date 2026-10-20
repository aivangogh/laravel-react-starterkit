import { Tabs, TabsContent, TabsList, TabsTrigger } from '@app/ui/components/ui/tabs'
import { ProfileAvatarForm } from '@/features/profile/components/ProfileAvatarForm'
import { ProfileInfoForm } from '@/features/profile/components/ProfileInfoForm'
import { ProfilePasswordForm } from '@/features/profile/components/ProfilePasswordForm'

export function ProfilePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-muted-foreground text-sm">
          Manage your account details and preferences.
        </p>
      </header>

      <Tabs defaultValue="profile" className="gap-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="avatar">Avatar</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileInfoForm />
        </TabsContent>
        <TabsContent value="password">
          <ProfilePasswordForm />
        </TabsContent>
        <TabsContent value="avatar">
          <ProfileAvatarForm />
        </TabsContent>
      </Tabs>
    </div>
  )
}
