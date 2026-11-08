import React from 'react';
import { ActiveTab, Contact } from '../../types';
import { 
  LayoutDashboard, 
  Users, 
  PenSquare, 
  Send, 
  History, 
  Settings, 
  Sparkles, 
  ExternalLink,
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  contacts: Contact[];
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  contacts,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Compute metrics for badges
  const totalContacts = contacts.length;
  const sentCount = contacts.filter((c) => c.status === 'Marked as Sent').length;
  const remainingCount = totalContacts - sentCount;
  const invalidCount = contacts.filter((c) => !c.isValidPhone).length;

  const navItems: { id: ActiveTab; label: string; icon: React.ElementType; badge?: string | number; badgeColor?: string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'contacts',
      label: 'Contacts',
      icon: Users,
      badge: totalContacts > 0 ? totalContacts : undefined,
      badgeColor: invalidCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700',
    },
    {
      id: 'composer',
      label: 'Message Composer',
      icon: PenSquare,
    },
    {
      id: 'sender',
      label: 'Send Messages',
      icon: Send,
      badge: remainingCount > 0 && totalContacts > 0 ? `${remainingCount} left` : undefined,
      badgeColor: 'bg-emerald-100 text-emerald-800 font-bold',
    },
    {
      id: 'history',
      label: 'Campaign History',
      icon: History,
      badge: sentCount > 0 ? `${sentCount} sent` : undefined,
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Banner with Brand */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Business Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <span className="text-xl">🍲</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-lg tracking-tight">
                  Recipe Mantra
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  100% Free & Private
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                WhatsApp Personal Message Assistant
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                        isActive
                          ? 'bg-emerald-700 text-emerald-100'
                          : item.badgeColor || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick CTA & Mobile Hamburger */}
          <div className="flex items-center gap-2">
            {remainingCount > 0 && totalContacts > 0 && activeTab !== 'sender' && (
              <button
                onClick={() => onTabChange('sender')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Start Sending ({remainingCount})</span>
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg animate-in slide-in-from-top-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
