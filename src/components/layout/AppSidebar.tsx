import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard, Users, Clock, CalendarDays, DollarSign, BarChart3,
  Briefcase, GraduationCap, Headset, Megaphone, PieChart, Settings,
  Globe, Building2, CreditCard, Server, ChevronLeft, LogOut, Zap,
  FileText, UserPlus, Network, UserMinus, CalendarCheck
} from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, SidebarHeader, useSidebar,
} from '@/components/ui/sidebar';
import { NavLink } from '@/components/NavLink';
import { useAuthStore } from '@/store/auth-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

type Role = 'super_admin' | 'company_admin' | 'hr_manager' | 'recruiter' | 'user';

interface NavItem {
  title: string;
  url: string;
  icon: any;
  roles: Role[]; // which roles can see this item
}

const ALL_ROLES: Role[] = ['company_admin', 'hr_manager', 'recruiter', 'user'];
const ADMIN_HR: Role[] = ['company_admin', 'hr_manager'];
const ADMIN_ONLY: Role[] = ['company_admin'];

const mainNav: NavItem[] = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, roles: ALL_ROLES },
  { title: 'Employees', url: '/employees', icon: Users, roles: ADMIN_HR },
  { title: 'Attendance', url: '/attendance', icon: Clock, roles: ALL_ROLES },
  { title: 'Leave', url: '/leave', icon: CalendarDays, roles: ALL_ROLES },
  { title: 'Holidays', url: '/holidays', icon: CalendarCheck, roles: ALL_ROLES },
  { title: 'Payroll', url: '/payroll', icon: DollarSign, roles: [...ADMIN_HR, 'user', 'recruiter'] },
  { title: 'Performance', url: '/performance', icon: BarChart3, roles: ALL_ROLES },
  { title: 'Recruitment', url: '/recruitment', icon: Briefcase, roles: ['company_admin', 'hr_manager', 'recruiter'] },
  { title: 'Learning', url: '/learning', icon: GraduationCap, roles: ALL_ROLES },
  { title: 'Help Desk', url: '/helpdesk', icon: Headset, roles: ALL_ROLES },
  { title: 'Announcements', url: '/announcements', icon: Megaphone, roles: ALL_ROLES },
  { title: 'Documents', url: '/documents', icon: FileText, roles: ALL_ROLES },
  { title: 'Reports', url: '/reports', icon: PieChart, roles: ADMIN_HR },
  { title: 'Onboarding', url: '/onboarding', icon: UserPlus, roles: ADMIN_HR },
  { title: 'Org Chart', url: '/org-chart', icon: Network, roles: ALL_ROLES },
  { title: 'Exit Mgmt', url: '/exit-management', icon: UserMinus, roles: ADMIN_HR },
  { title: 'Settings', url: '/settings', icon: Settings, roles: ADMIN_ONLY },
];

const superAdminNav = [
  { title: 'Platform Overview', url: '/admin', icon: Globe },
  { title: 'Companies', url: '/admin/companies', icon: Building2 },
  { title: 'Subscriptions', url: '/admin/subscriptions', icon: CreditCard },
  { title: 'System', url: '/admin/system', icon: Server },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { profile, signOut } = useAuthStore();
  const isSuperAdmin = profile?.platform_role === 'super_admin';
  const userRole = (profile?.platform_role || 'user') as Role;

  // Filter sidebar items by user's role
  const filteredNav = isSuperAdmin
    ? mainNav // super_admin sees everything
    : mainNav.filter(item => item.roles.includes(userRole));

  const isActive = (url: string) => {
    if (url === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(url);
  };

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  const roleLabel = (role: string) => {
    const labels: Record<string, string> = {
      super_admin: 'Super Admin',
      company_admin: 'Admin',
      hr_manager: 'HR Manager',
      recruiter: 'Recruiter',
      user: 'Employee',
    };
    return labels[role] || role;
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
            <Zap className="h-4 w-4" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight">FastestHR</span>
          )}
        </Link>
      </SidebarHeader>

      <Separator />

      <SidebarContent className="px-2">
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">Main Systems</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink
                      to={item.url}
                      className="transition-all hover:text-primary font-medium"
                      activeClassName="bg-primary/10 text-primary font-semibold rounded-md"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isSuperAdmin && (
          <SidebarGroup>
            <Separator className="mb-2" />
            {!collapsed && <SidebarGroupLabel className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin Override</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {superAdminNav.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                    >
                      <NavLink
                        to={item.url}
                        className="transition-all hover:text-destructive font-medium"
                        activeClassName="bg-destructive/10 text-destructive font-semibold rounded-md"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3">
        <Separator className="mb-3" />
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback className="bg-primary/20 text-primary font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex flex-1 flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-primary">{profile?.full_name}</span>
              <Badge variant="outline" className="w-fit border-border text-[10px] capitalize text-muted-foreground mt-1">
                {roleLabel(profile?.platform_role || 'user')}
              </Badge>
            </div>
          )}
          {!collapsed && (
            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
