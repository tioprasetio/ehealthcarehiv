import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  LayoutDashboard, 
  BookOpen, 
  Pill, 
  ClipboardList, 
  Calendar, 
  Image, 
  Users, 
  LogOut,
  Menu,
  X,
  Briefcase
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { role, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const patientNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/education', label: 'Edukasi', icon: BookOpen },
    { href: '/medications', label: 'Jadwal Obat', icon: Pill },
    { href: '/health-log', label: 'Catatan Kesehatan', icon: ClipboardList },
    { href: '/lab-results', label: 'Hasil Lab', icon: Image },
    { href: '/control-schedule', label: 'Jadwal Kontrol', icon: Calendar },
    { href: '/profile', label: 'Edit Akun', icon: Users },
  ];

  const adminNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/patients", label: "Pasien", icon: Users },
    { href: "/education", label: "Edukasi", icon: BookOpen },
    { href: "/manage-schedules", label: "Kelola Jadwal", icon: Pill },
    { href: "/staff", label: "Tenaga Medis", icon: Briefcase },
    { href: "/profile", label: "Edit Akun", icon: Users },
  ];

  const navItems = role === 'admin' ? adminNavItems : patientNavItems;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-foreground/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transition-transform duration-300 lg:translate-x-0 lg:static",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
                <Heart className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-foreground">E-Health Care</h1>
                <p className="text-xs text-muted-foreground">
                  {role === 'admin' ? 'Tenaga Medis' : 'Pasien'}
                </p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Keluar
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-card border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                <Heart className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">E-Health Care</span>
            </div>
            <div className="w-10" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
