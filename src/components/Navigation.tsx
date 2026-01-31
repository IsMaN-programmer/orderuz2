import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, ShoppingBag, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { ROUTE_PATHS } from '@/lib/index';
import { cn } from '@/lib/utils';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

/**
 * Bottom navigation bar for OrderUZ.
 * Designed with an immersive glassmorphism effect to float over video content.
 * Follows mobile-first principles with high-contrast icons for visibility.
 */
export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const navItems = [
    {
      label: 'Home',
      path: ROUTE_PATHS.HOME,
      icon: Home,
      id: 'home',
    },
    {
      label: 'Search',
      path: ROUTE_PATHS.SEARCH,
      icon: Search,
      id: 'search',
    },
    {
      label: 'Orders',
      path: ROUTE_PATHS.ORDERS,
      icon: ShoppingBag,
      id: 'orders',
    },
    {
      label: 'Profile',
      path: ROUTE_PATHS.PROFILE,
      icon: User,
      id: 'profile',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2">
      <div className="mx-auto max-w-md">
        <div className="relative flex items-center justify-around rounded-2xl border border-white/10 bg-background/60 py-3 shadow-2xl backdrop-blur-xl">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={() => onTabChange(item.id)}
                className={({ isActive: linkActive }) =>
                  cn(
                    'relative flex flex-col items-center gap-1 transition-all duration-300',
                    isActive || linkActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  )
                }
              >
                <div className="relative">
                  <Icon
                    size={24}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={cn(
                      'transition-transform duration-300',
                      isActive && 'scale-110'
                    )}
                  />
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary"
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                </div>
                <span className="text-[10px] font-medium tracking-wide">
                  {item.label}
                </span>
                
                {/* Ripple/Ambient Glow Effect for Active Tab */}
                {isActive && (
                  <div className="absolute inset-0 -z-10 animate-pulse opacity-20">
                    <div className="h-full w-full rounded-full bg-primary/20 blur-md" />
                  </div>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
      
      {/* Safe Area Padding for iOS/Modern Android Devices */}
      <div className="h-safe-bottom" />
    </nav>
  );
}
