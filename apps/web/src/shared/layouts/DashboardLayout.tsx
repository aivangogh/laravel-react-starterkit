import { Link, Outlet, useNavigate } from '@tanstack/react-router'
import { LogOut, Rocket, User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@app/ui/components/ui/avatar'
import { Button } from '@app/ui/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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
import { AppSidebarNav } from '@/shared/components/AppSidebarNav'
import { useLogout, useUser } from '@/features/auth/hooks/useAuth'
import { initialsOf } from '@/shared/lib/initials'

const APP_NAME = 'Starter Kit'

export function DashboardLayout() {
  const navigate = useNavigate()
  const user = useUser()
  const logout = useLogout()

  function onLogout() {
    logout.mutate(undefined, {
      onSuccess: () => void navigate({ to: '/login' }),
    })
  }

  return (
    // The sidebar writes its open/collapsed state to the `sidebar_state` cookie; read it back here.
    <SidebarProvider defaultOpen={!document.cookie.includes('sidebar_state=false')}>
      {/* Collapsible-to-icon sidebar; rail + Ctrl/Cmd+B toggle it. */}
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" render={<Link to="/" />}>
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Rocket className="size-4" />
                </div>
                <span className="truncate font-semibold">{APP_NAME}</span>
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
        {/* Topbar */}
        <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 flex h-14 items-center gap-2 border-b px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" aria-label="Toggle sidebar" />

          <Link to="/" className="font-semibold md:hidden">
            {APP_NAME}
          </Link>

          <div className="ml-auto flex items-center gap-2">
            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    className="flex h-auto items-center gap-2 px-2 py-1.5"
                    aria-label={`Account: ${user?.name ?? 'user'}`}
                  />
                }
              >
                <Avatar className="size-8">
                  {user?.avatar_url && <AvatarImage src={user.avatar_url} alt={user.name} />}
                  <AvatarFallback>{initialsOf(user?.name)}</AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium sm:inline">{user?.name}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="flex flex-col gap-0.5">
                    <span className="text-foreground truncate font-medium">{user?.name}</span>
                    <span className="text-muted-foreground truncate text-xs font-normal">
                      {user?.email}
                    </span>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link to="/profile" />}>
                  <User className="size-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  disabled={logout.isPending}
                  onClick={onLogout}
                >
                  <LogOut className="size-4" />
                  <span>{logout.isPending ? 'Signing out…' : 'Sign out'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Routed page content */}
        <div className="flex-1 p-4 md:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
