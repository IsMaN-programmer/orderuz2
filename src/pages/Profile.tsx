import React from 'react';
import { motion } from 'framer-motion';
import {
  User as UserIcon,
  MapPin,
  CreditCard,
  Bell,
  Settings,
  Heart,
  History,
  LogOut,
  ChevronRight,
  ShieldCheck,
  HelpCircle,
  Languages,
  Moon
} from 'lucide-react';
import { ROUTE_PATHS, User } from '@/lib/index';
import { IMAGES } from '@/assets/images';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { springPresets, fadeInUp, staggerContainer, staggerItem } from '@/lib/motion';

const mockUser: User = {
  id: 'u1',
  name: 'Alisher Usmanov',
  email: 'alisher.u@example.uz',
  phone: '+998 90 123 45 67',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
  address: '15 Amir Temur Avenue, Tashkent, Uzbekistan',
  favoriteRestaurants: ['r1', 'r2'],
  savedVideos: ['v1', 'v4', 'v7']
};

export default function Profile() {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springPresets.gentle}
        className="relative h-64 w-full"
      >
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={IMAGES.APP_INTERFACE_10}
            alt="Profile Background"
            className="w-full h-full object-cover opacity-30 blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
        </div>

        <div className="relative container mx-auto px-6 pt-16 flex flex-col items-center">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            transition={springPresets.snappy}
            className="relative"
          >
            <Avatar className="w-24 h-24 border-4 border-primary/20 ring-4 ring-background">
              <AvatarImage src={mockUser.avatar} alt={mockUser.name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {mockUser.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <Badge className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground px-2 py-0.5 border-2 border-background">
              Gold
            </Badge>
          </motion.div>

          <h1 className="mt-4 text-2xl font-bold text-foreground">{mockUser.name}</h1>
          <p className="text-muted-foreground font-mono text-sm">{mockUser.email}</p>
          
          <Button variant="outline" size="sm" className="mt-4 rounded-full border-primary/20 bg-background/50 backdrop-blur">
            Edit Profile
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="container mx-auto px-4 -mt-6"
      >
        <div className="grid grid-cols-3 gap-3">
          {[ 
            { label: 'Orders', value: '24', icon: History },
            { label: 'Favorites', value: '12', icon: Heart },
            { label: 'Saved', value: '38', icon: Bell },
          ].map((stat, i) => (
            <motion.div key={i} variants={staggerItem}>
              <Card className="bg-card/80 backdrop-blur-md border-border/50 shadow-lg">
                <CardContent className="p-3 flex flex-col items-center justify-center text-center">
                  <stat.icon className="w-4 h-4 text-primary mb-1" />
                  <span className="text-lg font-bold font-mono leading-none">{stat.value}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{stat.label}</span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <ScrollArea className="h-full">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="container mx-auto px-4 mt-8 space-y-6"
        >
          {/* Account Section */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-3">
              Account Settings
            </h2>
            <Card className="bg-card/50 backdrop-blur border-border/40 divide-y divide-border/40">
              <ProfileMenuItem icon={MapPin} label="Delivery Addresses" subLabel={mockUser.address} />
              <ProfileMenuItem icon={CreditCard} label="Payment Methods" subLabel="MasterCard ending in 4242" />
              <ProfileMenuItem icon={ShieldCheck} label="Security & Privacy" />
            </Card>
          </section>

          {/* Preferences Section */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-3">
              Preferences
            </h2>
            <Card className="bg-card/50 backdrop-blur border-border/40 divide-y divide-border/40">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive order updates</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-secondary/10">
                    <Moon className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium">Dark Mode</p>
                    <p className="text-xs text-muted-foreground">Easier on the eyes</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
              <ProfileMenuItem icon={Languages} label="App Language" subLabel="English (US)" />
            </Card>
          </section>

          {/* Support Section */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-3">
              Support & Legal
            </h2>
            <Card className="bg-card/50 backdrop-blur border-border/40 divide-y divide-border/40">
              <ProfileMenuItem icon={HelpCircle} label="Help Center" />
              <ProfileMenuItem icon={ShieldCheck} label="Terms of Service" />
              <ProfileMenuItem icon={ShieldCheck} label="Privacy Policy" />
            </Card>
          </section>

          <Button 
            variant="destructive" 
            className="w-full h-14 rounded-2xl flex items-center justify-center gap-2 text-lg font-semibold shadow-xl shadow-destructive/20"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </Button>

          <div className="pt-4 pb-8 text-center">
            <p className="text-xs text-muted-foreground">
              OrderUZ Version 2.4.0 (2026)
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              © 2026 OrderUZ Technologies Inc.
            </p>
          </div>
        </motion.div>
      </ScrollArea>
    </div>
  );
}

interface ProfileMenuItemProps {
  icon: React.ElementType;
  label: string;
  subLabel?: string;
  onClick?: () => void;
}

function ProfileMenuItem({ icon: Icon, label, subLabel, onClick }: ProfileMenuItemProps) {
  return (
    <motion.button
      whileTap={{ backgroundColor: 'oklch(var(--accent) / 0.5)' }}
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 text-left transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-accent/20">
          <Icon className="w-5 h-5 text-accent-foreground" />
        </div>
        <div>
          <p className="font-medium">{label}</p>
          {subLabel && <p className="text-xs text-muted-foreground line-clamp-1">{subLabel}</p>}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </motion.button>
  );
}
