import { useRef, type ChangeEvent } from 'react'
import { Upload } from 'lucide-react'
import { Alert, AlertDescription } from '@app/ui/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@app/ui/components/ui/avatar'
import { Button } from '@app/ui/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@app/ui/components/ui/card'
import { formErrors } from '@/shared/lib/form'
import { useUser } from '@/features/auth/hooks/useAuth'
import { useRemoveAvatar, useUploadAvatar } from '@/features/profile/hooks/useProfile'
import { initialsOf } from '@/shared/lib/initials'

/** Upload/remove the current user's avatar. The session user refresh updates the preview. */
export function ProfileAvatarForm() {
  const user = useUser()
  const uploadAvatar = useUploadAvatar()
  const removeAvatar = useRemoveAvatar()
  const fileInput = useRef<HTMLInputElement>(null)

  // Surface the error (and 422 `avatar` field error) from whichever action last failed.
  const errors = formErrors(uploadAvatar.error ?? removeAvatar.error)
  const isBusy = uploadAvatar.isPending || removeAvatar.isPending

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) return
    uploadAvatar.mutate(file, {
      // Allow re-selecting the same file after a failed upload.
      onSettled: () => void (input.value = ''),
    })
  }

  return (
    <Card data-slot="profile-avatar-form">
      <CardHeader>
        <CardTitle>Avatar</CardTitle>
        <CardDescription>PNG, JPG or GIF. A square image works best.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {errors.alert && (
          <Alert variant="destructive">
            <AlertDescription>{errors.alert}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            {user?.avatar_url && <AvatarImage src={user.avatar_url} alt={user.name} />}
            <AvatarFallback className="text-lg">{initialsOf(user?.name)}</AvatarFallback>
          </Avatar>

          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              aria-label="Choose an avatar image"
              onChange={onFileChange}
            />
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={() => fileInput.current?.click()}
            >
              <Upload className="size-4" />
              {uploadAvatar.isPending ? 'Uploading…' : 'Upload new'}
            </Button>
            {user?.avatar_url && (
              <Button
                type="button"
                variant="ghost"
                disabled={isBusy}
                onClick={() => removeAvatar.mutate()}
              >
                {removeAvatar.isPending ? 'Removing…' : 'Remove'}
              </Button>
            )}
          </div>
        </div>

        {errors.fields.avatar && <p className="text-destructive text-sm">{errors.fields.avatar}</p>}
      </CardContent>
    </Card>
  )
}
