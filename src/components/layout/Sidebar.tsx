import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, Truck, QrCode, ShieldAlert, 
  BarChart3, Mountain, Building2, Users, ClipboardList, 
  Bell, LogOut, Menu, X 
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { ROUTES } from '../../constants/routes';
import { cn } from '../../lib/utils';
import { ROLE_COLORS } from '../../utils/roleColors';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const navItems = [
    { path: ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MINE_OFFICER', 'SUPPLY_OFFICER', 'INSPECTOR'] },
    { path: ROUTES.BATCHES, label: 'Batches', icon: Package, roles: ['ADMIN', 'MINE_OFFICER', 'SUPPLY_OFFICER'] },
    { path: ROUTES.MOVEMENTS, label: 'Movement Events', icon: Truck, roles: ['ADMIN', 'SUPPLY_OFFICER'] },
    { path: ROUTES.VERIFICATION, label: 'QR Verification', icon: QrCode, roles: ['ADMIN', 'MINE_OFFICER', 'SUPPLY_OFFICER', 'INSPECTOR'] },
    { path: ROUTES.FRAUD, label: 'Fraud & Risk', icon: ShieldAlert, roles: ['ADMIN'] },
    { path: ROUTES.REPORTS, label: 'Reports', icon: BarChart3, roles: ['ADMIN', 'SUPPLY_OFFICER'] },
    { path: ROUTES.MINES, label: 'Mines', icon: Mountain, roles: ['ADMIN', 'MINE_OFFICER'] },
    { path: ROUTES.ORGANIZATIONS, label: 'Organizations', icon: Building2, roles: ['ADMIN'] },
    { path: ROUTES.USERS, label: 'Users', icon: Users, roles: ['ADMIN'] },
    { path: ROUTES.AUDIT_LOGS, label: 'Audit Logs', icon: ClipboardList, roles: ['ADMIN'] },
    { path: ROUTES.NOTIFICATIONS, label: 'Notifications', icon: Bell, roles: ['ADMIN', 'MINE_OFFICER', 'SUPPLY_OFFICER', 'INSPECTOR'] },
  ];

  const filteredNavItems = navItems.filter(item => user?.role && item.roles.includes(user.role));

  const roleColor = user?.role ? ROLE_COLORS[user.role as keyof typeof ROLE_COLORS] : { bg: 'bg-gray-100', text: 'text-gray-800' };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar text-white transition-all duration-300 ease-in-out md:relative",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          isCollapsed ? "md:w-20" : "w-64"
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-600 font-bold text-white">
              MT
            </div>
            {!isCollapsed && <span className="text-xl font-bold tracking-tight whitespace-nowrap">MineTrace</span>}
          </div>
          
          {/* Mobile Close */}
          <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
          
          {/* Desktop Collapse Toggle */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className="hidden md:block text-slate-400 hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors group relative",
                isActive 
                  ? "bg-slate-800 text-white border-l-4 border-amber-500" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white border-l-4 border-transparent"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", isCollapsed && "mx-auto")} />
              {!isCollapsed && <span className="font-medium truncate">{item.label}</span>}
              
              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Profile Footer */}
        <div className="border-t border-slate-800 p-4">
          <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-900 border border-slate-700 text-sm font-bold text-white">
              {user?.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-medium text-white">{user?.fullName}</span>
                <span className={cn("truncate text-xs px-1.5 py-0.5 rounded-full mt-1 w-fit", roleColor.bg, roleColor.text)}>
                  {user?.role?.replace('_', ' ')}
                </span>
              </div>
            )}
          </div>
          
          <button 
            onClick={handleLogout}
            className={cn(
              "mt-4 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors",
              isCollapsed && "justify-center"
            )}
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
