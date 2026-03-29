import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Menu, Bell, Search, User as UserIcon, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { ROUTES } from '../../constants/routes';
import { batchApi } from '../../api/batchApi';
import { useQuery } from '@tanstack/react-query';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults, isLoading: isSearchLoading } = useQuery({
    queryKey: ['batchSearch', debouncedSearch],
    queryFn: () => batchApi.getAll({ search: debouncedSearch }),
    enabled: debouncedSearch.length > 2,
  });

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === ROUTES.DASHBOARD) return 'Dashboard';
    if (path === ROUTES.USERS) return 'User Management';
    if (path === ROUTES.ORGANIZATIONS) return 'Organizations';
    if (path === ROUTES.MINES) return 'Mines';
    if (path === ROUTES.BATCHES) return 'Mineral Batches';
    if (path.startsWith('/batches/')) return `Batches > ${path.split('/').pop()}`;
    if (path === ROUTES.MOVEMENTS) return 'Movement Events';
    if (path === ROUTES.VERIFICATION) return 'Batch Verification';
    if (path === ROUTES.FRAUD) return 'Fraud & Risk Analysis';
    if (path === ROUTES.REPORTS) return 'Reports';
    if (path === ROUTES.NOTIFICATIONS) return 'Notifications';
    if (path === ROUTES.AUDIT_LOGS) return 'Audit Logs';
    if (path === ROUTES.PROFILE) return 'Profile & Settings';
    return 'MineTrace';
  };

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="md:hidden text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-semibold text-gray-800 hidden sm:block truncate max-w-[200px] lg:max-w-md">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-4 flex-1 justify-end">
        {/* Global Search */}
        <div className="relative w-full max-w-md hidden md:block" ref={searchRef}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
              placeholder="Search batch code (e.g. MT-2026-001)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
            />
          </div>
          
          {/* Search Results Dropdown */}
          {isSearchOpen && debouncedSearch.length > 2 && (
            <div className="absolute mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50 max-h-60 overflow-y-auto">
              {isSearchLoading ? (
                <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
              ) : searchResults?.data?.length > 0 ? (
                searchResults.data.map((batch: any) => (
                  <button
                    key={batch.id}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                    onClick={() => {
                      navigate(ROUTES.BATCH_DETAIL(batch.batchCode || batch.id));
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                  >
                    <div className="font-medium text-gray-900 font-mono">{batch.batchCode}</div>
                    <div className="text-xs text-gray-500">{batch.mineralType} • {batch.mineName}</div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500">No batches found matching "{debouncedSearch}"</div>
              )}
            </div>
          )}
        </div>

        {/* Notifications */}
        <Link 
          to={ROUTES.NOTIFICATIONS}
          className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
          )}
        </Link>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 focus:outline-none"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-sm border border-primary-200">
              {user?.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
            </div>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.fullName}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <Link
                to={ROUTES.PROFILE}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsProfileOpen(false)}
              >
                <UserIcon className="mr-2 h-4 w-4" />
                Profile & Settings
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
