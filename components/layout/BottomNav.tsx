'use client';

import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  LayoutGrid,
  AlertTriangle,
  ClipboardList,
  Users,
  Building2,
  Settings,
  BarChart2,
  FileDown,
  DollarSign,
  type LucideIcon,
} from 'lucide-react';

interface BottomNavProps {
  role: string;
  department: string;
}

interface Tab {
  label: string;
  route: string;
  icon: LucideIcon;
}

function getTabsForRole(role: string, department: string): Tab[] {
  if (role === 'worker') {
    const hasIssuesTab = ['Machining', 'Fabrikasi', 'QC', 'Delivery'].includes(department);
    const base: Tab[] = [
      { label: 'My Jobs', route: '/jobs',  icon: Briefcase },
      { label: 'Board',   route: '/board', icon: LayoutGrid },
    ];
    if (hasIssuesTab) {
      base.push({ label: 'Issues', route: '/issues', icon: AlertTriangle });
    }
    return base;
  }

  switch (role) {
    case 'admin':
      return [
        { label: 'Board',       route: '/board',       icon: LayoutGrid },
        { label: 'POs',         route: '/pos',         icon: ClipboardList },
        { label: 'Issues',      route: '/issues',      icon: AlertTriangle },
        { label: 'Users',       route: '/users',       icon: Users },
        { label: 'Departments', route: '/departments', icon: Building2 },
        { label: 'Settings',    route: '/settings',    icon: Settings },
      ];
    case 'manager':
      return [
        { label: 'Board',     route: '/board',     icon: LayoutGrid },
        { label: 'POs',       route: '/pos',       icon: ClipboardList },
        { label: 'Issues',    route: '/issues',    icon: AlertTriangle },
        { label: 'Analytics', route: '/analytics', icon: BarChart2 },
        { label: 'Export',    route: '/export',    icon: FileDown },
      ];
    case 'sales':
      return [
        { label: 'Board',     route: '/board',     icon: LayoutGrid },
        { label: 'POs',       route: '/pos',       icon: ClipboardList },
        { label: 'Analytics', route: '/analytics', icon: BarChart2 },
      ];
    case 'finance':
      return [
        { label: 'Board',     route: '/board',     icon: LayoutGrid },
        { label: 'Invoicing', route: '/invoicing', icon: DollarSign },
        { label: 'POs',       route: '/pos',       icon: ClipboardList },
      ];
    default:
      return [
        { label: 'Board', route: '/board', icon: LayoutGrid },
      ];
  }
}

export function BottomNav({ role, department }: BottomNavProps) {
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    setCurrentPath(window.location.pathname);
  }, []);

  const tabs = getTabsForRole(role, department);

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#E5E7EB] z-50 pb-safe">
      <div className="flex items-center h-full">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentPath === tab.route;
          const colorClass = isActive ? 'text-brand' : 'text-[#9CA3AF]';

          return (
            <button
              key={tab.route}
              type="button"
              onClick={() => {}}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-full min-h-[48px] ${colorClass}`}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={24} className={colorClass} />
              <span className={`text-xs font-medium ${colorClass}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
