// src/components/UI/AppHeader.tsx
'use client';

import React from 'react';
import { Menu, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/UI/button';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { ProfileDropdown } from '@/components/UI/ProfileDropdown';
import { useTheme } from '@/context/ThemeContext';

interface AppHeaderProps {
  onMenuOpen?: () => void;
  leftContent?: React.ReactNode;
}

export function AppHeader({ onMenuOpen, leftContent }: AppHeaderProps): React.ReactNode {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-header border-b border-header-border px-6 py-4 flex items-center justify-between shrink-0 z-30 shadow-sm">
      <div className="flex items-center gap-4">
        {onMenuOpen && (
          <Button variant="ghost" className="lg:hidden" onClick={onMenuOpen}>
            <Menu size={20} />
          </Button>
        )}
        {leftContent}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          onClick={toggleTheme}
          className="rounded-xl text-muted-foreground hover:text-foreground"
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </Button>
        <NotificationDropdown />
        <ProfileDropdown />
      </div>
    </header>
  );
}
