'use client';

import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  AlertTriangle,
  LayoutGrid,
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

function getTabsForRole(role: string): Tab[] {
  if (role === 'worker') {
    return [
      { label: 'Tugas',   route: '/jobs',   icon: Briefcase },
      { label: 'Kendala', route: '/issues', icon: AlertTriangle },
    ];
  }

  switch (role) {
    case 'admin':
      return [
        { label: 'Papan',    route: '/board',       icon: LayoutGrid },
        { label: 'PO',       route: '/pos',         icon: ClipboardList },
        { label: 'Masalah',  route: '/issues',      icon: AlertTriangle },
        { label: 'Pengguna', route: '/users',       icon: Users },
        { label: 'Dept',     route: '/departments', icon: Building2 },
        { label: 'Setelan',  route: '/settings',    icon: Settings },
      ];
    case 'manager':
      return [
        { label: 'Papan',    route: '/board',     icon: LayoutGrid },
        { label: 'PO',       route: '/pos',       icon: ClipboardList },
        { label: 'Masalah',  route: '/issues',    icon: AlertTriangle },
        { label: 'Analitik', route: '/analytics', icon: BarChart2 },
        { label: 'Ekspor',   route: '/export',    icon: FileDown },
      ];
    case 'sales':
      return [
        { label: 'Papan',    route: '/board',     icon: LayoutGrid },
        { label: 'PO',       route: '/pos',       icon: ClipboardList },
        { label: 'Analitik', route: '/analytics', icon: BarChart2 },
      ];
    case 'finance':
      return [
        { label: 'Papan',   route: '/board',     icon: LayoutGrid },
        { label: 'Tagihan', route: '/invoicing', icon: DollarSign },
        { label: 'PO',      route: '/pos',       icon: ClipboardList },
      ];
    default:
      return [{ label: 'Papan', route: '/board', icon: LayoutGrid }];
  }
}

export function BottomNav({ role }: BottomNavProps) {
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    setCurrentPath(window.location.pathname);
  }, []);

  const tabs = getTabsForRole(role);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] z-50"
      style={{
        height: 'calc(64px + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-center h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentPath === tab.route;
          const color = isActive ? '#2A7B76' : '#9CA3AF';
          return (
            <button
              key={tab.route}
              type="button"
              onClick={() => { window.location.href = tab.route; }}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 h-full"
              style={{ minHeight: 64, color }}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={24} />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
