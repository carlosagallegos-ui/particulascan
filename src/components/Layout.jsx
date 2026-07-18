import { Outlet, Link, useLocation } from 'react-router-dom';
import { Microscope, LayoutDashboard, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLang } from '@/lib/i18n';

export default function Layout() {
  const location = useLocation();
  const { lang, setLang, t } = useLang();

  const navItems = [
    { label: t('nav.new'), path: '/', icon: Microscope },
    { label: t('nav.history'), path: '/dashboard', icon: LayoutDashboard },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-60 border-r border-border bg-sidebar flex flex-col shrink-0">
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-base font-bold text-foreground flex items-center gap-2 tracking-tight">
            <span className="w-7 h-7 rounded-md bg-primary/15 flex items-center justify-center">
              <Microscope className="w-4 h-4 text-primary" />
            </span>
            {t('app.name')}
          </h1>
          <p className="text-[11px] text-muted-foreground mt-1.5 ml-9">{t('app.tagline')}</p>
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
        <div className="p-3 border-t border-sidebar-border space-y-3">
          <div className="flex items-center gap-1.5 rounded-md bg-sidebar-accent p-1">
            <Globe className="w-3.5 h-3.5 text-muted-foreground ml-1.5 shrink-0" />
            <button
              onClick={() => setLang('es')}
              className={cn(
                'flex-1 px-2 py-1 rounded text-xs font-medium transition-colors',
                lang === 'es' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              ES
            </button>
            <button
              onClick={() => setLang('en')}
              className={cn(
                'flex-1 px-2 py-1 rounded text-xs font-medium transition-colors',
                lang === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              EN
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">{t('app.version')}</p>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}