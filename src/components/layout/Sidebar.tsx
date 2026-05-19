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
  Sparkles,
  Menu,
  X,
  Zap,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import type { AnalysisType, ActiveView } from '@/types';
import { useState } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface NavItem {
  icon: React.ElementType;
  label: string;
  view: ActiveView;
  analysisType?: AnalysisType;
  description?: string;
  color?: string;
}

const navItems: NavItem[] = [
  {
    icon: Plus,
    label: 'New Analysis',
    view: 'analysis',
    description: 'Start fresh',
    color: 'text-violet-400',
  },
  {
    icon: User,
    label: 'Candidate Analysis',
    view: 'analysis',
    analysisType: 'candidate',
    description: 'Evaluate candidate',
    color: 'text-blue-400',
  },
  {
    icon: Users,
    label: 'Interviewer Analysis',
    view: 'analysis',
    analysisType: 'interviewer',
    description: 'Assess interviewer',
    color: 'text-emerald-400',
  },
  {
    icon: FileText,
    label: 'TA Summary',
    view: 'analysis',
    analysisType: 'taSummary',
    description: 'Recruiter summary',
    color: 'text-amber-400',
  },
  {
    icon: BarChart2,
    label: 'Interviewer Audit',
    view: 'analysis',
    analysisType: 'interviewerAudit',
    description: 'Multi-transcript audit',
    color: 'text-rose-400',
  },
];

const bottomNavItems: NavItem[] = [
  {
    icon: Clock,
    label: 'History',
    view: 'history',
    description: 'Past analyses',
    color: 'text-slate-400',
  },
  {
    icon: Settings,
    label: 'Settings',
    view: 'settings',
    description: 'Configure app',
    color: 'text-slate-400',
  },
];

function NavButton({
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
        'relative flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-all duration-200 group',
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
      <div
        className={cn(
          'relative flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all',
          isActive ? 'bg-primary/20' : 'bg-accent group-hover:bg-accent/80'
        )}
      >
        <Icon
          className={cn(
            'w-4 h-4 transition-colors',
            isActive ? 'text-primary' : item.color
          )}
        />
      </div>
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="overflow-hidden"
          >
            <span className="relative text-sm font-medium whitespace-nowrap">
              {item.label}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export function Sidebar() {
  const { activeView, analysisType, setActiveView, setAnalysisType, clearAll } =
    useAppStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (item: NavItem) => {
    setActiveView(item.view);
    if (item.analysisType) {
      setAnalysisType(item.analysisType);
    }
    if (item.label === 'New Analysis') {
      clearAll();
    }
    setMobileOpen(false);
  };

  const isNavItemActive = (item: NavItem) => {
    if (item.view !== activeView) return false;
    if (item.analysisType) {
      return analysisType === item.analysisType;
    }
    if (item.label === 'New Analysis' && activeView === 'analysis') {
      return !navItems.slice(1).some((ni) => ni.analysisType === analysisType);
    }
    return true;
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-3 py-5 border-b border-border">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden"
            >
              <div>
                <h1 className="text-sm font-bold text-foreground whitespace-nowrap leading-tight">
                  Interview
                </h1>
                <h1 className="text-sm font-bold gradient-text whitespace-nowrap leading-tight">
                  Intelligence
                </h1>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto hidden lg:flex flex-shrink-0 w-6 h-6 items-center justify-center rounded-md hover:bg-accent transition-colors text-muted-foreground"
        >
          <Menu className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="mb-3">
          <AnimatePresence>
            {!collapsed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2"
              >
                Analysis
              </motion.p>
            )}
          </AnimatePresence>
          {navItems.map((item) => (
            <NavButton
              key={item.label}
              item={item}
              isActive={isNavItemActive(item)}
              onClick={() => handleNavClick(item)}
              collapsed={collapsed}
            />
          ))}
        </div>

        <div className="pt-2 border-t border-border">
          <AnimatePresence>
            {!collapsed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2"
              >
                Manage
              </motion.p>
            )}
          </AnimatePresence>
          {bottomNavItems.map((item) => (
            <NavButton
              key={item.label}
              item={item}
              isActive={activeView === item.view}
              onClick={() => handleNavClick(item)}
              collapsed={collapsed}
            />
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center justify-between">
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Zap className="w-3 h-3 text-amber-400 flex-shrink-0" />
                  <span className="text-xs font-medium text-amber-400 whitespace-nowrap">
                    Powered by Groq
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );

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
              <SidebarContent />
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
        <SidebarContent />
      </motion.aside>
    </>
  );
}
