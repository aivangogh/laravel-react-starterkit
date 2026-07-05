<script setup lang="ts">
import { computed, ref } from 'vue'
import { Upload } from 'lucide-vue-next'
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
import { getErrorMessage, getValidationErrors } from '@/shared/lib/http'
import { useAuth } from '@/features/auth/composables/useAuth'
import { useProfile } from '@/features/profile/composables/useProfile'

const { user } = useAuth()
const { uploadAvatarMutation, removeAvatarMutation } = useProfile()

const fileInput = ref<HTMLInputElement | null>(null)

/** Two-letter fallback for the avatar, derived from the user's name. */
const initials = computed(() => {
  const name = user.value?.name?.trim()
  if (!name) return '?'
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
})

// Surface the 422 `avatar` field error from whichever action last ran.
const uploadFieldErrors = computed(() => getValidationErrors(uploadAvatarMutation.error.value))
const errorMessage = computed(() => {
  if (uploadAvatarMutation.isError.value) return getErrorMessage(uploadAvatarMutation.error.value)
  if (removeAvatarMutation.isError.value) return getErrorMessage(removeAvatarMutation.error.value)
  return ''
})

const isBusy = computed(
  () => uploadAvatarMutation.isPending.value || removeAvatarMutation.isPending.value,
)

function onPickFile() {
  fileInput.value?.click()
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploadAvatarMutation.mutate(file, {
    onSettled: () => {
      // Allow re-selecting the same file after a failed upload.
      input.value = ''
    },
  })
}

function onRemove() {
  removeAvatarMutation.mutate()
}
</script>

<template>
  <Card data-slot="profile-avatar-form">
    <CardHeader>
      <CardTitle>Avatar</CardTitle>
      <CardDescription>PNG, JPG or GIF. A square image works best.</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <Alert
        v-if="errorMessage && Object.keys(uploadFieldErrors).length === 0"
        variant="destructive"
      >
        <AlertDescription>{{ errorMessage }}</AlertDescription>
      </Alert>

      <div class="flex items-center gap-4">
        <Avatar class="size-16">
          <AvatarImage v-if="user?.avatar_url" :src="user.avatar_url" :alt="user.name" />
          <AvatarFallback class="text-lg">{{ initials }}</AvatarFallback>
        </Avatar>

        <div class="flex flex-wrap gap-2">
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            aria-label="Choose an avatar image"
            @change="onFileChange"
          />
          <Button type="button" variant="outline" :disabled="isBusy" @click="onPickFile">
            <Upload class="size-4" />
            {{ uploadAvatarMutation.isPending.value ? 'Uploading…' : 'Upload new' }}
          </Button>
          <Button
            v-if="user?.avatar_url"
            type="button"
            variant="ghost"
            :disabled="isBusy"
            @click="onRemove"
          >
            {{ removeAvatarMutation.isPending.value ? 'Removing…' : 'Remove' }}
          </Button>
        </div>
      </div>

      <p v-if="uploadFieldErrors.avatar" class="text-sm text-destructive">
        {{ uploadFieldErrors.avatar[0] }}
      </p>
    </CardContent>
  </Card>
</template>
