import { Link, useLocation } from '@tanstack/react-router'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@app/ui/components/ui/sidebar'
import { useNavItems } from '@/shared/hooks/useNavItems'

export function AppSidebarNav() {
  const items = useNavItems()
  const pathname = useLocation({ select: (location) => location.pathname })
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu aria-label="Main">
          {items.map((item) => (
            <SidebarMenuItem key={item.to}>
              <SidebarMenuButton
                // Exact match, so a child route like `/users/1` never lights up the `/users` item.
                isActive={pathname === item.to}
                tooltip={item.title}
                render={
                  <Link
                    to={item.to}
                    // On mobile the sidebar is a drawer — close it once the user picks a destination.
                    onClick={() => isMobile && setOpenMobile(false)}
                  />
                }
              >
                {item.icon && <item.icon aria-hidden="true" />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
