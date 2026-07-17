import { Outlet, Link, useLocation } from 'react-router-dom';
import { Microscope, LayoutDashboard, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Nuevo Análisis', path: '/', icon: Microscope },
  { label: 'Historial', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Coloreo', path: '/coloring', icon: Palette },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-60 border-r border-border bg-sidebar flex flex-col shrink-0">
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-base font-bold text-foreground flex items-center gap-2 tracking-tight">
            <span className="w-7 h-7 rounded-md bg-primary/15 flex items-center justify-center">
              <Microscope className="w-4 h-4 text-primary" />
            </span>
            ParticleVision
          </h1>
          <p className="text-[11px] text-muted-foreground mt-1.5 ml-9">Analizador de partículas</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/12 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent'
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <p className="text-[11px] text-muted-foreground">v1.0 · Visión artificial</p>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}