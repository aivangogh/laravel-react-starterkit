<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { LogOut, Menu, User } from 'lucide-vue-next'
import { Avatar, AvatarFallback, AvatarImage } from '@app/ui/components/ui/avatar'
import { Button } from '@app/ui/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@app/ui/components/ui/dropdown-menu'
import { Separator } from '@app/ui/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@app/ui/components/ui/sheet'
import AppSidebarNav from '@/shared/components/AppSidebarNav.vue'
import { useAuth } from '@/features/auth/composables/useAuth'

const APP_NAME = 'Starter Kit'

const router = useRouter()
const { user, logoutMutation } = useAuth()

/** Controls the mobile navigation drawer. */
const mobileNavOpen = ref(false)

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

function onLogout() {
  logoutMutation.mutate(undefined, {
    onSuccess: () => {
      void router.push({ name: 'login' })
    },
  })
}
</script>

<template>
  <div class="flex min-h-screen bg-background text-foreground">
    <!-- Desktop sidebar -->
    <aside
      class="hidden w-64 shrink-0 flex-col border-r bg-card md:flex"
      aria-label="Sidebar"
    >
      <div class="flex h-14 items-center px-6">
        <RouterLink :to="{ name: 'home' }" class="text-lg font-semibold tracking-tight">
          {{ APP_NAME }}
        </RouterLink>
      </div>
      <Separator />
      <AppSidebarNav class="flex-1 overflow-y-auto p-3" />
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <!-- Topbar -->
      <header
        class="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <!-- Mobile nav trigger + drawer -->
        <Sheet v-model:open="mobileNavOpen">
          <SheetTrigger as-child>
            <Button variant="ghost" size="icon" class="md:hidden" aria-label="Open navigation">
              <Menu class="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" class="w-72 p-0">
            <SheetHeader class="h-14 justify-center px-6 text-left">
              <SheetTitle>{{ APP_NAME }}</SheetTitle>
            </SheetHeader>
            <Separator />
            <AppSidebarNav class="p-3" @navigate="mobileNavOpen = false" />
          </SheetContent>
        </Sheet>

        <RouterLink :to="{ name: 'home' }" class="font-semibold md:hidden">
          {{ APP_NAME }}
        </RouterLink>

        <div class="ml-auto flex items-center gap-2">
          <!-- User menu -->
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button
                variant="ghost"
                class="flex h-auto items-center gap-2 px-2 py-1.5"
                :aria-label="`Account: ${user?.name ?? 'user'}`"
              >
                <Avatar class="size-8">
                  <AvatarImage v-if="user?.avatar_url" :src="user.avatar_url" :alt="user.name" />
                  <AvatarFallback>{{ initials }}</AvatarFallback>
                </Avatar>
                <span class="hidden text-sm font-medium sm:inline">{{ user?.name }}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-56">
              <DropdownMenuLabel class="flex flex-col gap-0.5">
                <span class="truncate font-medium">{{ user?.name }}</span>
                <span class="truncate text-xs font-normal text-muted-foreground">
                  {{ user?.email }}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <!-- Placeholder target until a dedicated profile page ships (Phase 6). -->
              <DropdownMenuItem as-child>
                <RouterLink :to="{ name: 'home' }">
                  <User class="size-4" />
                  <span>Profile</span>
                </RouterLink>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                :disabled="logoutMutation.isPending.value"
                @select="onLogout"
              >
                <LogOut class="size-4" />
                <span>{{ logoutMutation.isPending.value ? 'Signing out…' : 'Sign out' }}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <!-- Routed page content -->
      <main class="flex-1 p-4 md:p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
