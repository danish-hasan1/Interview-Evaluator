'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Plus,
  User,
  Users,
  FileText,
  BarChart2,
  Clock,
  Settings,
  Menu,
  X,
  Zap,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import type { AnalysisType, ActiveView } from '@/types';
import { useState, useCallback, memo } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface NavItem {
  icon: React.ElementType;
  label: string;
  view: ActiveView;
  analysisType?: AnalysisType;
  color?: string;
}

const navItems: NavItem[] = [
  { icon: Plus,      label: 'New Analysis',        view: 'analysis',  color: 'text-teal-600 dark:text-teal-400' },
  { icon: User,      label: 'Candidate Analysis',  view: 'analysis',  analysisType: 'candidate',        color: 'text-blue-400' },
  { icon: Users,     label: 'Interviewer Analysis',view: 'analysis',  analysisType: 'interviewer',      color: 'text-emerald-400' },
  { icon: FileText,  label: 'TA Summary',          view: 'analysis',  analysisType: 'taSummary',        color: 'text-amber-400' },
  { icon: BarChart2, label: 'Interviewer Audit',   view: 'analysis',  analysisType: 'interviewerAudit', color: 'text-rose-400' },
];

const bottomNavItems: NavItem[] = [
  { icon: Clock,    label: 'History',  view: 'history',  color: 'text-slate-400' },
  { icon: Settings, label: 'Settings', view: 'settings', color: 'text-slate-400' },
];

// Defined OUTSIDE Sidebar so it never gets recreated as a new type on re-render
const NavButton = memo(function NavButton({
  item,
  isActive,
  onClick,
  collapsed,
}: {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-colors duration-150 group',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      )}
    >
      {isActive && (
        <motion.div
          layoutId="activeNav"
          className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/20"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
        />
      )}
      <div className={cn(
        'relative flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
        isActive ? 'bg-primary/20' : 'bg-accent group-hover:bg-accent/80'
      )}>
        <Icon className={cn('w-4 h-4', isActive ? 'text-primary' : item.color)} />
      </div>
      {!collapsed && (
        <span className="relative text-sm font-medium whitespace-nowrap">
          {item.label}
        </span>
      )}
    </motion.button>
  );
});

// Extracted OUTSIDE Sidebar — prevents remount-on-every-render blink
const SidebarContent = memo(function SidebarContent({
  collapsed,
  activeView,
  analysisType,
  onNavClick,
  onToggleCollapse,
}: {
  collapsed: boolean;
  activeView: ActiveView;
  analysisType: AnalysisType;
  onNavClick: (item: NavItem) => void;
  onToggleCollapse: () => void;
}) {
  const isNavItemActive = (item: NavItem) => {
    if (item.view !== activeView) return false;
    if (item.analysisType) return analysisType === item.analysisType;
    if (item.label === 'New Analysis' && activeView === 'analysis') {
      return !navItems.slice(1).some((ni) => ni.analysisType === analysisType);
    }
    return true;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-3 py-5 border-b border-border">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-teal-700 to-teal-500 flex items-center justify-center shadow-lg">
          <Brain className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-foreground whitespace-nowrap leading-tight">Interview</h1>
            <h1 className="text-sm font-bold gradient-text whitespace-nowrap leading-tight">Intelligence</h1>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="ml-auto hidden lg:flex flex-shrink-0 w-6 h-6 items-center justify-center rounded-md hover:bg-accent transition-colors text-muted-foreground"
        >
          <Menu className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="mb-3">
          {!collapsed && (
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Analysis
            </p>
          )}
          {navItems.map((item) => (
            <NavButton
              key={item.label}
              item={item}
              isActive={isNavItemActive(item)}
              onClick={() => onNavClick(item)}
              collapsed={collapsed}
            />
          ))}
        </div>
        <div className="pt-2 border-t border-border">
          {!collapsed && (
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Manage
            </p>
          )}
          {bottomNavItems.map((item) => (
            <NavButton
              key={item.label}
              item={item}
              isActive={activeView === item.view}
              onClick={() => onNavClick(item)}
              collapsed={collapsed}
            />
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Zap className="w-3 h-3 text-amber-400 flex-shrink-0" />
              <span className="text-xs font-medium text-amber-400 whitespace-nowrap">Powered by Groq</span>
            </div>
          )}
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
});

export function Sidebar() {
  // Individual selectors — component only re-renders when these specific values change
  const activeView  = useAppStore((s) => s.activeView);
  const analysisType = useAppStore((s) => s.analysisType);
  const setActiveView  = useAppStore((s) => s.setActiveView);
  const setAnalysisType = useAppStore((s) => s.setAnalysisType);
  const clearAll = useAppStore((s) => s.clearAll);

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = useCallback((item: NavItem) => {
    setActiveView(item.view);
    if (item.analysisType) setAnalysisType(item.analysisType);
    if (item.label === 'New Analysis') clearAll();
    setMobileOpen(false);
  }, [setActiveView, setAnalysisType, clearAll]);

  const handleToggleCollapse = useCallback(() => {
    setCollapsed((c) => !c);
  }, []);

  return (
    <>
      {/* Mobile Hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-card border border-border rounded-xl flex items-center justify-center shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-64 bg-card border-r border-border"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent"
              >
                <X className="w-4 h-4" />
              </button>
              <SidebarContent
                collapsed={false}
                activeView={activeView}
                analysisType={analysisType}
                onNavClick={handleNavClick}
                onToggleCollapse={handleToggleCollapse}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 256 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="hidden lg:flex flex-col h-full bg-card border-r border-border overflow-hidden flex-shrink-0"
      >
        <SidebarContent
          collapsed={collapsed}
          activeView={activeView}
          analysisType={analysisType}
          onNavClick={handleNavClick}
          onToggleCollapse={handleToggleCollapse}
        />
      </motion.aside>
    </>
  );
}
