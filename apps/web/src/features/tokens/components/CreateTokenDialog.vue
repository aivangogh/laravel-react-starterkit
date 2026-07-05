<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Check, Copy, Plus } from 'lucide-vue-next'
import type { NewApiToken } from '@app/types'
import { Button } from '@app/ui/components/ui/button'
import { Input } from '@app/ui/components/ui/input'
import { Label } from '@app/ui/components/ui/label'
import { Alert, AlertDescription } from '@app/ui/components/ui/alert'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@app/ui/components/ui/dialog'
import { getErrorMessage, getValidationErrors } from '@/shared/lib/http'
import { useTokens } from '@/features/tokens/composables/useTokens'

const { createMutation } = useTokens()

const open = ref(false)
const form = reactive({ name: '', abilities: '' })
// The one-time secret returned by the API. While set, the dialog shows the "copy it now" view.
const createdToken = ref<NewApiToken | null>(null)
const copied = ref(false)

const fieldErrors = computed(() => getValidationErrors(createMutation.error.value))
const errorMessage = computed(() =>
  createMutation.isError.value && Object.keys(fieldErrors.value).length === 0
    ? getErrorMessage(createMutation.error.value)
    : '',
)

function reset() {
  form.name = ''
  form.abilities = ''
  createdToken.value = null
  copied.value = false
  createMutation.reset()
}

// Fully reset the dialog once it closes so the next open starts fresh (and the secret is dropped).
watch(open, (isOpen) => {
  if (!isOpen) reset()
})

/** Split the comma-separated abilities field into a list; `undefined` grants full access. */
function parseAbilities(): string[] | undefined {
  const list = form.abilities
    .split(',')
    .map((ability) => ability.trim())
    .filter(Boolean)
  return list.length ? list : undefined
}

function onSubmit() {
  createMutation.mutate(
    { name: form.name, abilities: parseAbilities() },
    { onSuccess: (token) => (createdToken.value = token) },
  )
}

async function copyToken() {
  if (!createdToken.value) return
  await navigator.clipboard.writeText(createdToken.value.plain_text_token)
  copied.value = true
  window.setTimeout(() => (copied.value = false), 2000)
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <Button size="sm">
        <Plus class="size-4" />
        Create token
      </Button>
    </DialogTrigger>

    <DialogContent>
      <!-- Success view: the plaintext secret, shown exactly once. -->
      <template v-if="createdToken">
        <DialogHeader>
          <DialogTitle>Token created</DialogTitle>
          <DialogDescription>Copy your new token — it won't be shown again.</DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertDescription>
            Make sure to copy your token now. For security, you won't be able to see it again.
          </AlertDescription>
        </Alert>

        <div class="space-y-2">
          <Label for="plain-token">Token</Label>
          <div class="flex items-center gap-2">
            <Input
              id="plain-token"
              :model-value="createdToken.plain_text_token"
              readonly
              class="font-mono text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Copy token"
              @click="copyToken"
            >
              <Check v-if="copied" class="size-4" />
              <Copy v-else class="size-4" />
            </Button>
          </div>
          <p v-if="copied" class="text-muted-foreground text-xs">Copied to clipboard.</p>
        </div>

        <DialogFooter>
          <DialogClose as-child>
            <Button type="button">Done</Button>
          </DialogClose>
        </DialogFooter>
      </template>

      <!-- Create form. -->
      <form v-else novalidate @submit.prevent="onSubmit">
        <DialogHeader>
          <DialogTitle>Create API token</DialogTitle>
          <DialogDescription>Give your token a name to remember where it's used.</DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <Alert v-if="errorMessage" variant="destructive">
            <AlertDescription>{{ errorMessage }}</AlertDescription>
          </Alert>

          <div class="space-y-2">
            <Label for="token-name">Name</Label>
            <Input id="token-name" v-model="form.name" placeholder="e.g. CI deploy" required />
            <p v-if="fieldErrors.name" class="text-destructive text-sm">
              {{ fieldErrors.name[0] }}
            </p>
          </div>

          <div class="space-y-2">
            <Label for="token-abilities">
              Abilities <span class="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input id="token-abilities" v-model="form.abilities" placeholder="read, write" />
            <p class="text-muted-foreground text-xs">
              Comma-separated. Leave blank to grant full access.
            </p>
            <p v-if="fieldErrors.abilities" class="text-destructive text-sm">
              {{ fieldErrors.abilities[0] }}
            </p>
          </div>
        </div>

        <DialogFooter>
          <DialogClose as-child>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" :disabled="createMutation.isPending.value">
            {{ createMutation.isPending.value ? 'Creating…' : 'Create token' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
