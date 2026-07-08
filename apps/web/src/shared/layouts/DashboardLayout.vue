<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { LogOut, Rocket, User } from 'lucide-vue-next'
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
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@app/ui/components/ui/sidebar'
import AppSidebarNav from '@/shared/components/AppSidebarNav.vue'
import { useAuth } from '@/features/auth/composables/useAuth'

const APP_NAME = 'Starter Kit'

const router = useRouter()
const { user, logoutMutation } = useAuth()

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
  <SidebarProvider>
    <!-- Collapsible-to-icon sidebar; rail + Ctrl/Cmd+B toggle it, state persists via cookie. -->
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton as-child size="lg">
              <RouterLink :to="{ name: 'home' }">
                <div
                  class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
                >
                  <Rocket class="size-4" />
                </div>
                <span class="truncate font-semibold">{{ APP_NAME }}</span>
              </RouterLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <AppSidebarNav />
      </SidebarContent>

      <SidebarRail />
    </Sidebar>

    <SidebarInset>
      <!-- Topbar -->
      <header
        class="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <SidebarTrigger class="-ml-1" aria-label="Toggle sidebar" />

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
              <DropdownMenuItem as-child>
                <RouterLink :to="{ name: 'profile.edit' }">
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
      <div class="flex-1 p-4 md:p-6">
        <RouterView />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
