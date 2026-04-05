import { useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { Bell, User, LayoutDashboard, Wallet, Shield, Settings, AlertCircle, MessageSquare, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { useAppData } from '../store/AppContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',    path: '/' },
  { icon: AlertCircle,     label: 'Crisis Advisor', path: '/crisis', highlight: true },
  { icon: Wallet,          label: 'Spending',     path: '/spending' },
  { icon: Shield,          label: 'Insurance',    path: '/insurance' },
  { icon: MessageSquare,   label: 'AI Coach',     path: '/ai-coach' },
  { icon: Settings,        label: 'Settings',     path: '/settings' },
];

export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isOnboarded, resetData } = useAppData();

  useEffect(() => {
    if (!isOnboarded) navigate('/onboarding', { replace: true });
  }, [isOnboarded, navigate]);

  const handleReset = () => {
    resetData();
    navigate('/onboarding', { replace: true });
  };

  if (!isOnboarded) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Crunch</span>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <Avatar>
              <AvatarFallback className="bg-blue-100 text-blue-600">
                <User className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Left Sidebar */}
      <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 z-40 flex flex-col">
        <nav className="p-4 space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative ${
                  isActive
                    ? item.highlight ? 'bg-red-50 text-red-600 font-medium' : 'bg-blue-50 text-blue-600 font-medium'
                    : item.highlight ? 'text-red-600 hover:bg-red-50' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
                {item.highlight && !isActive && (
                  <span className="absolute right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Reset profile */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Reset Profile
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 mt-16 p-8">
        <Outlet />
      </main>
    </div>
  );
}
