import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Globe,
  LayoutDashboard,
  Users,
  Landmark,
  FileText,
  Receipt,
  CreditCard,
  Folder,
  ArrowLeftRight,
  CheckSquare,
  Clock,
  BarChart2,
  Bell,
  ShieldCheck,
  UserCheck,
  Settings,
  ChevronDown,
  LogOut,
  X,
} from 'lucide-react';
import { NAVIGATION_ITEMS } from '../../constants/navigation';

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    'Banks & Branches': true,
    'Documents & Handovers': false,
    'Tasks & Follow-ups': false,
  });

  const toggleMenu = (name: string) => {
    setExpandedMenus((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const getIcon = (iconName: string) => {
    const props = { className: 'w-4 h-4 shrink-0' };
    switch (iconName) {
      case 'LayoutDashboard':
        return <LayoutDashboard {...props} />;
      case 'Users':
        return <Users {...props} />;
      case 'Landmark':
        return <Landmark {...props} />;
      case 'FileText':
        return <FileText {...props} />;
      case 'Receipt':
        return <Receipt {...props} />;
      case 'CreditCard':
        return <CreditCard {...props} />;
      case 'Folder':
        return <Folder {...props} />;
      case 'ArrowLeftRight':
        return <ArrowLeftRight {...props} />;
      case 'CheckSquare':
        return <CheckSquare {...props} />;
      case 'Clock':
        return <Clock {...props} />;
      case 'BarChart2':
        return <BarChart2 {...props} />;
      case 'Bell':
        return <Bell {...props} />;
      case 'ShieldCheck':
        return <ShieldCheck {...props} />;
      case 'UserCheck':
        return <UserCheck {...props} />;
      case 'Settings':
        return <Settings {...props} />;
      default:
        return <LayoutDashboard {...props} />;
    }
  };

  const handleSignOut = () => {
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#111C34] text-slate-300 flex flex-col border-r border-[#1B2A4A] transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Branding Section */}
        <div className="h-16 px-5 border-b border-[#1B2A4A] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
              <Globe className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <div className="text-white font-bold text-sm tracking-tight leading-tight">
                Visa Consultancy
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                Management System
              </div>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
          {NAVIGATION_ITEMS.map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isCurrentModule =
              item.href === '/'
                ? location.pathname === '/'
                : location.pathname === item.href ||
                  location.pathname.startsWith(`${item.href}/`) ||
                  (hasSubItems && item.subItems!.some((sub) => location.pathname === sub.href || location.pathname.startsWith(`${sub.href}/`)));

            const isExpanded = expandedMenus[item.name] ?? isCurrentModule;

            if (hasSubItems) {
              return (
                <div key={item.name} className="space-y-1">
                  <div
                    onClick={() => {
                      toggleMenu(item.name);
                      if (!isCurrentModule) {
                        navigate(item.href);
                      }
                    }}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer select-none ${
                      isCurrentModule
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-[#1A2644]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {getIcon(item.iconName)}
                      <span>{item.name}</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </div>

                  {/* Submenu for items with sub-pages */}
                  {isExpanded && item.subItems && (
                    <div className="pl-10 pr-2 py-1 space-y-1">
                      {item.subItems.map((sub) => {
                        const isSubActive =
                          sub.href === '/'
                            ? location.pathname === '/'
                            : location.pathname === sub.href || location.pathname.startsWith(`${sub.href}/`);
                        return (
                          <NavLink
                            key={sub.name}
                            to={sub.href}
                            onClick={onCloseMobile}
                            className={`block px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              isSubActive
                                ? 'bg-blue-600/30 text-blue-300 font-semibold'
                                : 'text-slate-400 hover:text-white hover:bg-[#1A2644]/60'
                            }`}
                          >
                            {sub.name}
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onCloseMobile}
                className={({ isActive: isLinkActive }) => {
                  const active =
                    item.href === '/'
                      ? location.pathname === '/'
                      : isLinkActive || location.pathname.startsWith(item.href);
                  return `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-[#1A2644]'
                  }`;
                }}
              >
                <div className="flex items-center gap-3">
                  {getIcon(item.iconName)}
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Bottom Footer Section */}
        <div className="p-3.5 border-t border-[#1B2A4A] flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="font-medium text-slate-400">ApexVisa v1.0</span>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer hover:underline"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
