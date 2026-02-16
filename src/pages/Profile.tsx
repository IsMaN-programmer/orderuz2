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
  X,
  Gift,
  Camera,
  User,
  UtensilsCrossed
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
  const [isPromoDialogOpen, setIsPromoDialogOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [isTermsDialogOpen, setIsTermsDialogOpen] = useState(false);
  const [isPrivacyDialogOpen, setIsPrivacyDialogOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [selectedAccountType, setSelectedAccountType] = useState<'user' | 'restaurant' | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [mapPlacemark, setMapPlacemark] = useState<any>(null);
  const [markerCoordinates, setMarkerCoordinates] = useState<[number, number] | null>(null);
  const [currentCityKey, setCurrentCityKey] = useState<string>('tashkent');
  const mapRef = React.useRef<any>(null);
  const resizeHandlerRef = React.useRef<(() => void) | null>(null);
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [editForm, setEditForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address,
    avatar: user.avatar
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleLogout = () => {
    user.logout();
    setIsEditDialogOpen(false);
    toast.success('Logged out successfully');
  };

  const handleAuth = () => {
    if (authMode === 'register') {
      if (!authForm.name || !authForm.email || !authForm.password || authForm.password !== authForm.confirmPassword) {
        toast.error('Please fill in all fields correctly');
        return;
      }
      user.register(authForm.name, authForm.email, authForm.password, selectedAccountType);
      toast.success('Registration successful!');
    } else {
      if (!authForm.email || !authForm.password) {
        toast.error('Please enter email and password');
        return;
      }
      const loginSuccess = user.login(authForm.email, authForm.password, selectedAccountType);
      if (!loginSuccess) {
        toast.error('Invalid email or password');
        return;
      }
      toast.success('Login successful!');
    }
    setIsAuthDialogOpen(false);
    setAuthForm({ name: '', email: '', password: '', confirmPassword: '' });
    setSelectedAccountType(null);
  };

  const handleSaveProfile = () => {
    user.updateProfile(editForm);
    setIsEditDialogOpen(false);
    setSelectedFile(null);
    toast.success(t('success'));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setEditForm({ ...editForm, avatar: dataUrl });
      };
      reader.readAsDataURL(file);
    }
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

  const handlePromoCodeActivate = () => {
    const upperPromo = promoCode.toUpperCase();
    
    if (!upperPromo) {
      toast.error('Please enter a promo code');
      return;
    }

    if (upperPromo === 'EVO24') {
      toast.success('Promo code EVO24 activated successfully!');
      setPromoCode('');
      setIsPromoDialogOpen(false);
    } else {
      toast.error('This promo code does not exist');
    }
  };

  const cities = [
    'tashkent', 'samarkand', 'bukhara', 'andijan', 
    'namangan', 'fergana', 'nukus', 'termez',
    'gulistan', 'jizzax', 'khiva'
  ];

  // Координаты городов для Yandex Maps
  const cityCoordinates: { [key: string]: [number, number] } = {
    'tashkent': [41.2995, 69.2401],
    'samarkand': [39.6549, 66.9597],
    'bukhara': [39.7747, 64.4161],
    'andijan': [40.784786, 72.346006],
    'namangan': [40.9979, 71.6709],
    'fergana': [40.3870, 71.7758],
    'nukus': [42.4648, 59.5640],
    'termez': [37.220860, 67.277407],
    'gulistan': [40.489097, 68.783408],
    'jizzax': [40.1097, 67.8397],
    'khiva': [41.3786, 60.3636]
  };

  // Initialize current city key when dialog opens
  React.useEffect(() => {
    if (!isLocationDialogOpen) return;

    const userLocationCityLower = user.location.city.toLowerCase();
    const matchedCity = cities.find(city => city.toLowerCase() === userLocationCityLower);
    if (matchedCity) {
      setCurrentCityKey(matchedCity);
    } else {
      // Fallback to tashkent if city not found
      setCurrentCityKey('tashkent');
    }
  }, [isLocationDialogOpen, user.location.city]);

  React.useEffect(() => {
    if (!isLocationDialogOpen) {
      // Cleanup when dialog closes
      if (resizeHandlerRef.current) {
        window.removeEventListener('resize', resizeHandlerRef.current);
        resizeHandlerRef.current = null;
      }
      if (mapInstance) {
        try {
          mapInstance.destroy();
        } catch (e) {
          console.error('Error destroying map:', e);
        }
        mapRef.current = null;
        setMapInstance(null);
        setMapPlacemark(null);
      }
      return;
    }

    const initializeMapWithDelay = () => {
      setTimeout(() => {
        const mapElement = document.getElementById('yandex-map');
        if (!mapElement) {
          console.error('Map element not found');
          return;
        }

        try {
          // Clean up previous map instance
          if (mapInstance) {
            mapInstance.destroy();
            mapRef.current = null;
          }

          // Use the currentCityKey which is always in lowercase English
          const coordinates = cityCoordinates[currentCityKey] || cityCoordinates['tashkent'];

          const newMap = new window.ymaps.Map('yandex-map', {
            center: coordinates,
            zoom: 13,
            controls: ['zoomControl', 'fullscreenControl']
          });

          // Add marker
          const newPlacemark = new window.ymaps.Placemark(coordinates, {
            hintContent: 'Your delivery location',
            balloonContent: 'Click on map to select address'
          }, {
            preset: 'islands#redDotIcon'
          });

          newMap.geoObjects.add(newPlacemark);

          // Handle map clicks
          newMap.events.add('click', (e: any) => {
            const coords = e.get('coords');
            // Ensure the placemark exists
            if (newPlacemark && newPlacemark.geometry) {
              newPlacemark.geometry.setCoordinates(coords);
            }
            
            // Store the coordinates
            setMarkerCoordinates(coords);
            
            // Get address from coordinates using Yandex Geocoder
            window.ymaps.geocode(coords).then((res: any) => {
              const firstGeoObject = res.geoObjects.get(0);
              if (firstGeoObject) {
                const address = firstGeoObject.getAddressLine();
                user.setLocation(user.location.city, address);
              }
            });
          });

          // Handle window resize with debounce
          let resizeTimeout: NodeJS.Timeout | null = null;
          const handleResize = () => {
            if (resizeTimeout) clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
              if (mapRef.current && mapRef.current.container) {
                try {
                  // Force map recalculation
                  mapRef.current.container.fitToViewport();
                  // Also trigger map event to recalculate
                  if (mapRef.current.setZoom) {
                    const currentZoom = mapRef.current.getZoom();
                    mapRef.current.setZoom(currentZoom);
                  }
                } catch (e) {
                  console.error('Error fitting map to viewport:', e);
                }
              }
            }, 200);
          };

          resizeHandlerRef.current = handleResize;
          window.addEventListener('resize', handleResize);

          mapRef.current = newMap;
          setMapInstance(newMap);
          setMapPlacemark(newPlacemark);
        } catch (error) {
          console.error('Error initializing map:', error);
        }
      }, 100);
    };

    // Load Yandex Maps API if not already loaded
    if (!window.ymaps) {
      const script = document.createElement('script');
      script.src = 'https://api-maps.yandex.ru/2.1/?apikey=2c34089b-a923-4979-b60c-f78f5c784734&lang=en_US';
      script.async = true;
      script.onload = () => {
        if (window.ymaps) {
          window.ymaps.ready(initializeMapWithDelay);
        }
      };
      document.body.appendChild(script);
    } else {
      window.ymaps.ready(initializeMapWithDelay);
    }

    return () => {
      if (resizeHandlerRef.current) {
        window.removeEventListener('resize', resizeHandlerRef.current);
        resizeHandlerRef.current = null;
      }
      if (mapInstance) {
        try {
          mapInstance.destroy();
        } catch (e) {
          console.error('Error destroying map in cleanup:', e);
        }
        mapRef.current = null;
      }
    };
  }, [isLocationDialogOpen, currentCityKey]);

  // Separate effect for updating map center when city changes - только движение, без пересоздания
  React.useEffect(() => {
    if (!isLocationDialogOpen || !mapRef.current || !mapPlacemark) return;

    try {
      // Use currentCityKey which is always in lowercase English
      const newCoordinates = cityCoordinates[currentCityKey] || cityCoordinates['tashkent'];
      
      // Update map center with animation
      mapRef.current.setCenter(newCoordinates, 13, {
        checkZoomRange: true,
        duration: 400
      });
      
      // Update marker position to the new city center
      if (mapPlacemark && mapPlacemark.geometry) {
        mapPlacemark.geometry.setCoordinates(newCoordinates);
      }
    } catch (error) {
      console.error('Error updating map center:', error);
    }
  }, [currentCityKey, isLocationDialogOpen, mapPlacemark]);

  // Effect to ensure map properly refreshes when dialog visibility changes
  React.useEffect(() => {
    if (!isLocationDialogOpen || !mapRef.current) return;

    // Give the DOM time to update and then refresh the map
    const timer = setTimeout(() => {
      try {
        if (mapRef.current && mapRef.current.container) {
          mapRef.current.container.fitToViewport();
        }
      } catch (e) {
        console.error('Error in fitToViewport:', e);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [isLocationDialogOpen]);

  return (
    <div className="h-screen bg-background pb-24 overflow-y-auto flex flex-col">
      {!user.isAuthenticated ? (
        // NOT AUTHENTICATED - Show Auth Screen
        <div className="h-full flex flex-col items-center justify-center container mx-auto px-4 py-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springPresets.gentle}
            className="text-center mb-12 max-w-md"
          >
            <h1 className="text-4xl font-black tracking-tighter mb-4 drop-shadow-lg text-foreground">
              Welcome to Order <span className="text-primary">UZ</span>
            </h1>
            <p className="text-muted-foreground text-lg mb-8">
              Sign in to your account or create a new one
            </p>
            
            {/* Account Type Selection */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedAccountType('user');
                    setAuthMode('login');
                    setIsAuthDialogOpen(true);
                  }}
                  className="p-4 rounded-2xl bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors text-sm font-semibold"
                >
                  Login as User
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedAccountType('restaurant');
                    setAuthMode('login');
                    setIsAuthDialogOpen(true);
                  }}
                  className="p-4 rounded-2xl bg-secondary/10 border border-secondary/30 hover:bg-secondary/20 transition-colors text-sm font-semibold"
                >
                  Login as Restaurant
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedAccountType('user');
                    setAuthMode('register');
                    setIsAuthDialogOpen(true);
                  }}
                  className="p-4 rounded-2xl bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors text-sm font-semibold"
                >
                  Register as User
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedAccountType('restaurant');
                    setAuthMode('register');
                    setIsAuthDialogOpen(true);
                  }}
                  className="p-4 rounded-2xl bg-secondary/10 border border-secondary/30 hover:bg-secondary/20 transition-colors text-sm font-semibold"
                >
                  Register as Restaurant
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        // AUTHENTICATED - Show Profile
        <>
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
              {user.accountType === 'restaurant' ? (
                <UtensilsCrossed className="w-4 h-4" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </Badge>
          </motion.div>

          <h1 className="mt-4 text-2xl font-bold text-foreground">{user.name}</h1>
          <p className="text-muted-foreground font-mono text-sm">{user.email}</p>
        </div>
      </motion.div>

      <ScrollArea className="h-full">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="container mx-auto px-4 mt-8 space-y-6"
        >
          {/* Stats Cards */}
          <div>
            <div className="grid grid-cols-3 gap-3">
              {[ 
                { label: t('orders_count'), value: user.ordersCount.toString(), icon: History },
                { label: t('favorites'), value: user.followedRestaurants.length.toString(), icon: Heart },
                { label: t('saved'), value: user.savedCount.toString(), icon: Bell },
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
              ))}            </div>
          </div>

          {/* Account Section */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-3">
              {t('accountSettings')}
            </h2>
            <Card className="bg-card/50 backdrop-blur border-border/40 divide-y divide-border/40">
              <ProfileMenuItem 
                icon={Edit} 
                label={t('editProfile')} 
                subLabel="Update your information"
                onClick={() => setIsEditDialogOpen(true)}
              />
              <ProfileMenuItem 
                icon={MapPin} 
                label={t('deliveryAddress')} 
                subLabel={`${user.location.city}, ${user.location.district}`}
                onClick={() => setIsLocationDialogOpen(true)}
              />
              <ProfileMenuItem icon={CreditCard} label={t('paymentMethods')} subLabel="UzCard ending in 4242" />
              <ProfileMenuItem icon={ShieldCheck} label={t('securityPrivacy')} />
              <ProfileMenuItem 
                icon={Gift} 
                label={t('promocodes')} 
                subLabel={t('enterPromoCodeSub')}
                onClick={() => setIsPromoDialogOpen(true)}
              />
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
              <ProfileMenuItem 
                icon={HelpCircle} 
                label={t('helpCenter')}
                onClick={() => window.open('https://t.me/+90Jy083WfhgyOTli', '_blank')}
              />
              <ProfileMenuItem 
                icon={ShieldCheck} 
                label={t('termsOfService')}
                onClick={() => setIsTermsDialogOpen(true)}
              />
              <ProfileMenuItem 
                icon={ShieldCheck} 
                label={t('privacyPolicy')}
                onClick={() => setIsPrivacyDialogOpen(true)}
              />
            </Card>
          </section>

          <Button 
            variant="destructive" 
            className="w-full h-14 rounded-2xl flex items-center justify-center gap-2 text-lg font-semibold shadow-xl shadow-destructive/20"
            onClick={handleLogout}
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
        </>
      )}

      {/* Auth Dialog */}
      <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {authMode === 'register' ? 'Account Registration' : 'Account Login'} 
              ({selectedAccountType === 'restaurant' ? 'Restaurant' : 'User'})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {authMode === 'register' && (
              <div>
                <Label>Full Name</Label>
                <Input 
                  value={authForm.name} 
                  onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                  placeholder="Enter your name"
                />
              </div>
            )}
            <div>
              <Label>Email</Label>
              <Input 
                type="email"
                value={authForm.email} 
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                placeholder="Enter your email"
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input 
                type="password"
                value={authForm.password} 
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                placeholder="Enter password"
              />
            </div>
            {authMode === 'register' && (
              <div>
                <Label>Confirm Password</Label>
                <Input 
                  type="password"
                  value={authForm.confirmPassword} 
                  onChange={(e) => setAuthForm({ ...authForm, confirmPassword: e.target.value })}
                  placeholder="Confirm password"
                />
              </div>
            )}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleAuth} className="flex-1">
                <Check className="w-4 h-4 mr-2" />
                {authMode === 'register' ? 'Register' : 'Login'}
              </Button>
              <Button variant="outline" onClick={() => setIsAuthDialogOpen(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('editProfile')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <Avatar className="w-20 h-20 border-2 border-primary/20">
                  <AvatarImage src={editForm.avatar} alt={editForm.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                    {editForm.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1.5 rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                  <Camera className="w-4 h-4" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>
            </div>
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

      <Dialog key={isLocationDialogOpen ? 'open' : 'closed'} open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-full sm:max-w-2xl max-h-[85vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{t('deliveryAddress')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>City</Label>
              <Select 
                value={currentCityKey} 
                onValueChange={(value) => {
                  // Update the city key
                  setCurrentCityKey(value);
                  // Also update user location with proper city name
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
            <div className="w-full">
              <Label>Precise Location (on map)</Label>
              {isLocationDialogOpen && (
                <div 
                  id="yandex-map" 
                  style={{ 
                    width: '100%', 
                    height: 'clamp(200px, 50vh, 350px)',
                    borderRadius: '8px', 
                    overflow: 'hidden', 
                    backgroundColor: '#f0f0f0'
                  }}
                  className="border border-border/40"
                />
              )}
              <p className="text-xs text-muted-foreground mt-2">Click on the map to select precise delivery location</p>
            </div>
            <div>
              <Label>Address Details</Label>
              <Input
                value={user.location.district}
                onChange={(e) => user.setLocation(user.location.city, e.target.value)}
                placeholder="Enter address details (apartment, house number, etc.)"
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

      <Dialog open={isPromoDialogOpen} onOpenChange={setIsPromoDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('promocodes')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3 mb-2">
              <Label className="block">{t('enterPromoCode')}</Label>
              <Input
                type="text"
                placeholder="example: EVO24"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handlePromoCodeActivate();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground mt-2">Enter promo code in uppercase letters and numbers</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handlePromoCodeActivate} className="flex-1">
                <Check className="w-4 h-4 mr-2" />
                Activate
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsPromoDialogOpen(false);
                  setPromoCode('');
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Terms of Service Dialog */}
      <Dialog open={isTermsDialogOpen} onOpenChange={setIsTermsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('termsOfService')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-foreground/90">
            <section>
              <h3 className="font-semibold text-base mb-2">{t('terms_section_1')}</h3>
              <p>{t('terms_content_1')}</p>
            </section>
            <section>
              <h3 className="font-semibold text-base mb-2">{t('terms_section_2')}</h3>
              <p>{t('terms_content_2')}</p>
            </section>
            <section>
              <h3 className="font-semibold text-base mb-2">{t('terms_section_3')}</h3>
              <p>{t('terms_content_3')}</p>
            </section>
            <section>
              <h3 className="font-semibold text-base mb-2">{t('terms_section_4')}</h3>
              <p>{t('terms_content_4')}</p>
            </section>
            <section>
              <h3 className="font-semibold text-base mb-2">{t('terms_section_5')}</h3>
              <p>{t('terms_content_5')}</p>
            </section>
            <section>
              <h3 className="font-semibold text-base mb-2">{t('terms_section_6')}</h3>
              <p>{t('terms_content_6')}</p>
            </section>
          </div>
          <Button onClick={() => setIsTermsDialogOpen(false)} className="w-full mt-4">
            {t('close')}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Dialog */}
      <Dialog open={isPrivacyDialogOpen} onOpenChange={setIsPrivacyDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('privacyPolicy')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-foreground/90">
            <section>
              <h3 className="font-semibold text-base mb-2">{t('privacy_section_1')}</h3>
              <p>{t('privacy_content_1')}</p>
            </section>
            <section>
              <h3 className="font-semibold text-base mb-2">{t('privacy_section_2')}</h3>
              <p>{t('privacy_content_2')}</p>
            </section>
            <section>
              <h3 className="font-semibold text-base mb-2">{t('privacy_section_3')}</h3>
              <p>{t('privacy_content_3')}</p>
            </section>
            <section>
              <h3 className="font-semibold text-base mb-2">{t('privacy_section_4')}</h3>
              <p>{t('privacy_content_4')}</p>
            </section>
            <section>
              <h3 className="font-semibold text-base mb-2">{t('privacy_section_5')}</h3>
              <p>{t('privacy_content_5')}</p>
            </section>
            <section>
              <h3 className="font-semibold text-base mb-2">{t('privacy_section_6')}</h3>
              <p>{t('privacy_content_6')}</p>
            </section>
          </div>
          <Button onClick={() => setIsPrivacyDialogOpen(false)} className="w-full mt-4">
            {t('close')}
          </Button>
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
      type="button"
      whileTap={{ backgroundColor: 'oklch(var(--accent) / 0.5)' }}
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 text-left transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3 pointer-events-none">
        <div className="p-2 rounded-xl bg-accent/20">
          <Icon className="w-5 h-5 text-accent-foreground" />
        </div>
        <div>
          <p className="font-medium">{label}</p>
          {subLabel && <p className="text-xs text-muted-foreground line-clamp-1">{subLabel}</p>}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground pointer-events-none" />
    </motion.button>
  );
}
