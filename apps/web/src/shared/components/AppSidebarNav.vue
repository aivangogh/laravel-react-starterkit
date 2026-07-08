<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@app/ui/components/ui/sidebar'
import { useNavItems } from '@/shared/composables/useNavItems'

const route = useRoute()
const { items } = useNavItems()
const { isMobile, setOpenMobile } = useSidebar()

/**
 * Whether a nav item points at the current route. Exact match on the route name (mirrors the old
 * `exact-active-class`), so a child route like `users.edit` never lights up the `users` item.
 */
function isActive(name: string): boolean {
  return route.name === name
}

/** On mobile the sidebar is a drawer — close it once the user picks a destination. */
function onNavigate(): void {
  if (isMobile.value) setOpenMobile(false)
}
</script>

<template>
  <SidebarGroup>
    <SidebarGroupContent>
      <SidebarMenu aria-label="Main">
        <SidebarMenuItem v-for="item in items" :key="item.name">
          <SidebarMenuButton as-child :is-active="isActive(item.name)" :tooltip="item.title">
            <RouterLink :to="{ name: item.name }" @click="onNavigate">
              <component :is="item.icon" v-if="item.icon" aria-hidden="true" />
              <span>{{ item.title }}</span>
            </RouterLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
</template>
