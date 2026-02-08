import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  CreditCard,
  Bell,
  Heart,
  History,
  LogOut,
  ChevronRight,
  ShieldCheck,
  HelpCircle,
  Languages,
  Moon,
  Sun,
  Edit,
  Check,
  X
} from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useTranslation } from '@/i18n/useTranslation';
import { IMAGES } from '@/assets/images';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { springPresets, staggerContainer, staggerItem } from '@/lib/motion';
import { toast } from 'sonner';
import type { Language } from '@/store/userStore';

export default function Profile() {
  const { t, language, tNested } = useTranslation();
  const user = useUserStore();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLanguageDialogOpen, setIsLanguageDialogOpen] = useState(false);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address
  });

  const handleSaveProfile = () => {
    user.updateProfile(editForm);
    setIsEditDialogOpen(false);
    toast.success(t('success'));
  };

  const handleLanguageChange = (lang: Language) => {
    user.setLanguage(lang);
    toast.success(`Language changed to ${lang.toUpperCase()}`);
  };

  const handleThemeToggle = () => {
    const newTheme = user.theme === 'dark' ? 'light' : 'dark';
    user.setTheme(newTheme);
    toast.success(`${newTheme === 'dark' ? 'Dark' : 'Light'} mode enabled`);
  };

  const cities = [
    'tashkent', 'samarkand', 'bukhara', 'andijan', 
    'namangan', 'fergana', 'nukus', 'termez'
  ];

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
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <Badge className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground px-2 py-0.5 border-2 border-background">
              Gold
            </Badge>
          </motion.div>

          <h1 className="mt-4 text-2xl font-bold text-foreground">{user.name}</h1>
          <p className="text-muted-foreground font-mono text-sm">{user.email}</p>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4 rounded-full border-primary/20 bg-background/50 backdrop-blur"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Edit className="w-4 h-4 mr-2" />
            {t('editProfile')}
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
            { label: t('orders_count'), value: '24', icon: History },
            { label: t('favorites'), value: user.followedRestaurants.length.toString(), icon: Heart },
            { label: t('saved'), value: '38', icon: Bell },
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
              {t('accountSettings')}
            </h2>
            <Card className="bg-card/50 backdrop-blur border-border/40 divide-y divide-border/40">
              <ProfileMenuItem 
                icon={MapPin} 
                label={t('deliveryAddresses')} 
                subLabel={`${user.location.city}, ${user.location.district}`}
                onClick={() => setIsLocationDialogOpen(true)}
              />
              <ProfileMenuItem icon={CreditCard} label={t('paymentMethods')} subLabel="UzCard ending in 4242" />
              <ProfileMenuItem icon={ShieldCheck} label={t('securityPrivacy')} />
            </Card>
          </section>

          {/* Preferences Section */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-3">
              {t('preferences')}
            </h2>
            <Card className="bg-card/50 backdrop-blur border-border/40 divide-y divide-border/40">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{t('pushNotifications')}</p>
                    <p className="text-xs text-muted-foreground">{t('receiveUpdates')}</p>
                  </div>
                </div>
                <Switch 
                  checked={user.notifications} 
                  onCheckedChange={user.toggleNotifications}
                />
              </div>
              
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-secondary/10">
                    {user.theme === 'dark' ? (
                      <Moon className="w-5 h-5 text-secondary" />
                    ) : (
                      <Sun className="w-5 h-5 text-secondary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{t('darkMode')}</p>
                    <p className="text-xs text-muted-foreground">{t('easierEyes')}</p>
                  </div>
                </div>
                <Switch 
                  checked={user.theme === 'dark'} 
                  onCheckedChange={handleThemeToggle}
                />
              </div>
              
              <ProfileMenuItem 
                icon={Languages} 
                label={t('appLanguage')} 
                subLabel={language === 'en' ? 'English' : language === 'ru' ? 'Русский' : 'O\'zbekcha'}
                onClick={() => setIsLanguageDialogOpen(true)}
              />
            </Card>
          </section>

          {/* Support Section */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-3">
              {t('supportLegal')}
            </h2>
            <Card className="bg-card/50 backdrop-blur border-border/40 divide-y divide-border/40">
              <ProfileMenuItem icon={HelpCircle} label={t('helpCenter')} />
              <ProfileMenuItem icon={ShieldCheck} label={t('termsOfService')} />
              <ProfileMenuItem icon={ShieldCheck} label={t('privacyPolicy')} />
            </Card>
          </section>

          <Button 
            variant="destructive" 
            className="w-full h-14 rounded-2xl flex items-center justify-center gap-2 text-lg font-semibold shadow-xl shadow-destructive/20"
            onClick={() => toast.info('Logout functionality would go here')}
          >
            <LogOut className="w-5 h-5" />
            {t('logOut')}
          </Button>

          <div className="pt-4 pb-8 text-center">
            <p className="text-xs text-muted-foreground">{t('version')}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{t('copyright')}</p>
          </div>
        </motion.div>
      </ScrollArea>

      {/* Dialogs */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('editProfile')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            <div>
              <Label>Address</Label>
              <Input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveProfile} className="flex-1">
                <Check className="w-4 h-4 mr-2" />
                {t('save')}
              </Button>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                <X className="w-4 h-4 mr-2" />
                {t('cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isLanguageDialogOpen} onOpenChange={setIsLanguageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('appLanguage')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {[
              { code: 'en' as Language, name: 'English', flag: '🇬🇧' },
              { code: 'ru' as Language, name: 'Русский', flag: '🇷🇺' },
              { code: 'uz' as Language, name: 'O\'zbekcha', flag: '🇺🇿' }
            ].map((lang) => (
              <Button
                key={lang.code}
                variant={language === lang.code ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => {
                  handleLanguageChange(lang.code);
                  setIsLanguageDialogOpen(false);
                }}
              >
                <span className="mr-3 text-2xl">{lang.flag}</span>
                {lang.name}
                {language === lang.code && <Check className="ml-auto w-4 h-4" />}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('deliveryAddresses')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>City</Label>
              <Select 
                value={user.location.city.toLowerCase()} 
                onValueChange={(value) => {
                  const cityName = tNested(`cities.${value}`);
                  user.setLocation(cityName, user.location.district);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {tNested(`cities.${city}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>District</Label>
              <Input
                value={user.location.district}
                onChange={(e) => user.setLocation(user.location.city, e.target.value)}
                placeholder="Enter district"
              />
            </div>
            <Button onClick={() => {
              setIsLocationDialogOpen(false);
              toast.success('Location updated!');
            }} className="w-full">
              <Check className="w-4 h-4 mr-2" />
              {t('save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
