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
  UtensilsCrossed,
  Play,
  Upload,
  Eye,
  ThumbsUp,
  Trash2
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { springPresets, staggerContainer, staggerItem } from '@/lib/motion';
import { toast } from 'sonner';
import type { Language } from '@/store/userStore';
import type { RestaurantVideo, FoodDescription, RestaurantProfile } from '@/lib/index';

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
  const [isSecurityDialogOpen, setIsSecurityDialogOpen] = useState(false);
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] = useState(false);
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');
  const [changePasswordForm, setChangePasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Restaurant specific state
  const [isVideoUploadDialogOpen, setIsVideoUploadDialogOpen] = useState(false);
  const [isSearchSettingsDialogOpen, setIsSearchSettingsDialogOpen] = useState(false);
  const [isAddFoodDialogOpen, setIsAddFoodDialogOpen] = useState(false);
  const [videoForm, setVideoForm] = useState({
    caption: '',
    foodName: '',
    foodPrice: '',
    videoFile: null as File | null
  });
  const [foodForm, setFoodForm] = useState({
    name: '',
    price: '',
    description: '',
    ingredients: '',
    preparation: '',
    category: 'Main Dish'
  });
  const [restaurantForm, setRestaurantForm] = useState({
    name: '',
    phone: '',
    description: '',
    city: 'Tashkent',
    address: '',
    coordinates: null as [number, number] | null,
    logo: null as File | null,
    photos: [] as File[]
  });
  const [mapInstanceRest, setMapInstanceRest] = useState<any>(null);
  const [mapPlacemarkRest, setMapPlacemarkRest] = useState<any>(null);
  const [editingRestaurantId, setEditingRestaurantId] = useState<string | null>(null);
  const [isRestaurantDetailsOpen, setIsRestaurantDetailsOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // Handle image load errors (for invalid blob URLs)
  const handleImageError = (imageSrc: string) => {
    setFailedImages((prev) => new Set([...prev, imageSrc]));
  };

  // Get image source, with fallback for failed loads
  const getImageSrc = (src: string | undefined, fallback: string): string => {
    if (!src) return fallback;
    if (failedImages.has(src)) return fallback;
    return src;
  };

  // Helper function to convert File to base64 string
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Helper function to convert multiple files to base64
  const filesToBase64 = async (files: File[]): Promise<string[]> => {
    return Promise.all(files.map(file => fileToBase64(file)));
  };

  const handleLogout = () => {
    user.logout();
    setIsEditDialogOpen(false);
    toast.success('Logged out successfully');
  };
  
  const handleAddRestaurantVideo = async () => {
    if (!videoForm.caption || !videoForm.foodName || !videoForm.foodPrice) {
      toast.error('Please fill in all video fields');
      return;
    }

    if (!videoForm.videoFile) {
      toast.error('Please select a video file');
      return;
    }

    // Check file size (max 50MB)
    if (videoForm.videoFile.size > 50 * 1024 * 1024) {
      toast.error('Video size must be less than 50MB');
      return;
    }

    try {
      const { saveVideo } = await import('@/lib/videoStorage');
      
      const videoId = `video-${Date.now()}`;
      
      // Save video blob to IndexedDB
      await saveVideo(videoId, videoForm.videoFile);
    
      const newVideo: RestaurantVideo = {
        id: videoId,
        videoUrl: videoId, // Store the video ID instead of URL
        thumbnailUrl: IMAGES.FOOD_VIDEOS_1,
        caption: videoForm.caption,
        foodName: videoForm.foodName,
        foodPrice: parseInt(videoForm.foodPrice),
        analytics: {
          views: 0,
          likes: 0,
          shares: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        createdAt: new Date().toISOString()
      };
      
      user.addRestaurantVideo(newVideo);
      setIsVideoUploadDialogOpen(false);
      setVideoForm({ caption: '', foodName: '', foodPrice: '', videoFile: null });
      toast.success('Video uploaded successfully!');
    } catch (error) {
      console.error('Error uploading video:', error);
      toast.error('Failed to upload the video');
    }
  };
  
  const handleAddRestaurantFoodItem = () => {
    if (!foodForm.name || !foodForm.price || !foodForm.description) {
      toast.error('Please fill in all food fields');
      return;
    }
    
    const newFoodItem = {
      id: `food-${Date.now()}`,
      name: foodForm.name,
      price: parseInt(foodForm.price),
      description: foodForm.description,
      foodDescription: {
        ingredients: foodForm.ingredients,
        preparation: foodForm.preparation,
        allergens: []
      } as FoodDescription,
      image: IMAGES.UZBEK_FOOD_3,
      category: foodForm.category
    };
    
    user.addRestaurantFoodItem(newFoodItem);
    setIsAddFoodDialogOpen(false);
    setFoodForm({
      name: '',
      price: '',
      description: '',
      ingredients: '',
      preparation: '',
      category: 'Main Dish'
    });
    toast.success('Food item added successfully!');
  };
  
  const handleAddRestaurant = async () => {
    if (!restaurantForm.name || !restaurantForm.address || !restaurantForm.coordinates) {
      toast.error('Please fill in all restaurant fields and select location on map');
      return;
    }
    
    try {
      // Convert logo to base64 if provided
      let logoBase64 = IMAGES.CHEF_COOKING_1;
      if (restaurantForm.logo) {
        logoBase64 = await fileToBase64(restaurantForm.logo);
      }

      // Convert photos to base64
      let photosBase64: string[] = [];
      if (restaurantForm.photos.length > 0) {
        photosBase64 = await filesToBase64(restaurantForm.photos);
      }

      const newRestaurant: RestaurantProfile = {
        id: `rest-${Date.now()}`,
        ownerId: user.userId,
        name: restaurantForm.name,
        logo: logoBase64,
        photos: photosBase64,
        category: 'Food Restaurant',
        description: restaurantForm.description,
        coordinates: restaurantForm.coordinates,
        address: restaurantForm.address,
        city: restaurantForm.city,
        phone: restaurantForm.phone,
        rating: 5,
        deliveryTime: '25-35 min',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      user.addManagedRestaurant(newRestaurant);
      setIsSearchSettingsDialogOpen(false);
      setRestaurantForm({
        name: '',
        phone: '',
        description: '',
        city: 'Tashkent',
        address: '',
        coordinates: null,
        logo: null,
        photos: []
      });
      setEditingRestaurantId(null);
      toast.success('Restaurant added successfully!');
    } catch (error) {
      console.error('Error adding restaurant:', error);
      toast.error('Error saving restaurant');
    }
  };
  
  const handleDeleteRestaurant = (restaurantId: string) => {
    user.deleteManagedRestaurant(restaurantId);
    toast.success('Restaurant deleted');
  };
  
  const handleViewRestaurantDetails = (restaurant: any) => {
    setSelectedRestaurant(restaurant);
    setRestaurantForm({
      name: restaurant.name,
      phone: restaurant.phone || '',
      description: restaurant.description,
      city: restaurant.city,
      address: restaurant.address,
      coordinates: restaurant.coordinates,
      logo: null,
      photos: []
    });
    setEditingRestaurantId(restaurant.id);
    setIsRestaurantDetailsOpen(true);
  };
  
  const handleUpdateRestaurant = async () => {
    if (!restaurantForm.name || !restaurantForm.address) {
      toast.error('Please fill in required fields');
      return;
    }
    
    try {
      const updatedData: any = {
        name: restaurantForm.name,
        phone: restaurantForm.phone,
        description: restaurantForm.description,
        city: restaurantForm.city,
        address: restaurantForm.address,
        coordinates: restaurantForm.coordinates || selectedRestaurant.coordinates
      };
      
      // Update logo if new one uploaded
      if (restaurantForm.logo) {
        updatedData.logo = await fileToBase64(restaurantForm.logo);
      }
      
      // Add new photos to existing ones
      if (restaurantForm.photos.length > 0) {
        const newPhotosBase64 = await filesToBase64(restaurantForm.photos);
        updatedData.photos = [...(selectedRestaurant.photos || []), ...newPhotosBase64];
      }
      
      user.updateManagedRestaurant(editingRestaurantId!, updatedData);
      setIsRestaurantDetailsOpen(false);
      setEditingRestaurantId(null);
      setSelectedRestaurant(null);
      setRestaurantForm({
        name: '',
        phone: '',
        description: '',
        city: 'Tashkent',
        address: '',
        coordinates: null,
        logo: null,
        photos: []
      });
      toast.success('Restaurant updated successfully!');
    } catch (error) {
      console.error('Error updating restaurant:', error);
      toast.error('Error saving restaurant');
    }
  };

  const handleDeletePhoto = (photoIndex: number) => {
    if (!selectedRestaurant?.photos) return;
    
    const updatedPhotos = selectedRestaurant.photos.filter((_: string, idx: number) => idx !== photoIndex);
    
    user.updateManagedRestaurant(editingRestaurantId!, {
      photos: updatedPhotos
    });
    
    setSelectedRestaurant({
      ...selectedRestaurant,
      photos: updatedPhotos
    });
    
    toast.success('Photo deleted');
  };

  const handleAuth = () => {
    if (authMode === 'register') {
      if (!authForm.name || !authForm.email || !authForm.password || authForm.password !== authForm.confirmPassword) {
        toast.error('Please fill in all fields correctly');
        return;
      }
      const registerSuccess = user.register(authForm.name, authForm.email, authForm.password, selectedAccountType);
      if (!registerSuccess) {
        toast.error('Email already registered');
        return;
      }
      toast.success('Registration successful!');
    } else {
      if (!authForm.email || !authForm.password) {
        toast.error('Please enter email and password');
        return;
      }
      const loginSuccess = user.login(authForm.email, authForm.password);
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

  const handleDeleteAccount = () => {
    if (!deleteAccountPassword) {
      toast.error('Please enter your password');
      return;
    }

    const success = user.deleteAccount(deleteAccountPassword);
    if (success) {
      toast.success('Account deleted successfully');
      setIsDeleteAccountDialogOpen(false);
      setDeleteAccountPassword('');
      // Account is deleted and user is logged out automatically
    } else {
      toast.error('Incorrect password');
      setDeleteAccountPassword('');
    }
  };

  const handleChangePassword = () => {
    const { currentPassword, newPassword, confirmPassword } = changePasswordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword === currentPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    const success = user.changePassword(currentPassword, newPassword);
    if (success) {
      toast.success('Password changed successfully');
      setIsChangePasswordDialogOpen(false);
      setChangePasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      toast.error('Incorrect current password');
      setChangePasswordForm({ ...changePasswordForm, currentPassword: '' });
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

  // Initialize Yandex Map for Search Settings
  React.useEffect(() => {
    if (!isSearchSettingsDialogOpen) {
      if (mapInstanceRest) {
        try {
          mapInstanceRest.destroy();
        } catch (e) {
          console.error('Error destroying map:', e);
        }
        setMapInstanceRest(null);
        setMapPlacemarkRest(null);
      }
      return;
    }

    const initializeMapWithDelay = () => {
      const mapElement = document.getElementById('yandex-map-restaurant');
      if (!mapElement) {
        console.error('Map element not found');
        return;
      }

      setTimeout(() => {
        try {
          if (mapInstanceRest) {
            mapInstanceRest.destroy();
          }

          // Map coordinates based on city - using Yandex Map standard coordinates
          const cityCoords: { [key: string]: [number, number] } = {
            'Tashkent': [41.2995, 69.2401],
            'Samarkand': [39.6548, 66.9597],
            'Bukhara': [39.7747, 64.4286],
            'Andijan': [40.7315, 72.6326],
            'Namangan': [40.5975, 71.6734],
            'Fergana': [40.3806, 71.7755]
          };

          const cityCoord = cityCoords[restaurantForm.city] || cityCoords['Tashkent'];
          const coordinates = restaurantForm.coordinates || cityCoord;

          const newMap = new window.ymaps.Map('yandex-map-restaurant', {
            center: coordinates,
            zoom: 13,
            controls: ['zoomControl', 'fullscreenControl']
          });

          // Add marker
          const newPlacemark = new window.ymaps.Placemark(coordinates, {
            hintContent: 'Restaurant location',
            balloonContent: 'Click on map to select restaurant address'
          }, {
            preset: 'islands#redDotIcon'
          });

          newMap.geoObjects.add(newPlacemark);

          // Handle map clicks
          newMap.events.add('click', (e: any) => {
            const coords = e.get('coords');
            if (newPlacemark && newPlacemark.geometry) {
              newPlacemark.geometry.setCoordinates(coords);
            }

            // Store coordinates
            setRestaurantForm((prev) => ({ ...prev, coordinates: coords }));

            // Get address from coordinates using Yandex Geocoder
            window.ymaps.geocode(coords).then((res: any) => {
              const firstGeoObject = res.geoObjects.get(0);
              if (firstGeoObject) {
                const address = firstGeoObject.getAddressLine();
                setRestaurantForm((prev) => ({ ...prev, address }));
              }
            });
          });

          setMapInstanceRest(newMap);
          setMapPlacemarkRest(newPlacemark);
        } catch (e) {
          console.error('Error initializing map:', e);
        }
      }, 300);
    };

    // Load Yandex Maps API if not already loaded, then initialize map
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
  }, [isSearchSettingsDialogOpen]);

  // Update restaurant map center and marker when city changes
  React.useEffect(() => {
    if (!isSearchSettingsDialogOpen || !mapInstanceRest || !mapPlacemarkRest) return;

    try {
      const cityCoords: { [key: string]: [number, number] } = {
        'Tashkent': [41.2995, 69.2401],
        'Samarkand': [39.6548, 66.9597],
        'Bukhara': [39.7747, 64.4286],
        'Andijan': [40.7315, 72.6326],
        'Namangan': [40.5975, 71.6734],
        'Fergana': [40.3806, 71.7755]
      };

      const newCityCoord = cityCoords[restaurantForm.city] || cityCoords['Tashkent'];

      // Update map center with animation
      mapInstanceRest.setCenter(newCityCoord, 13, {
        checkZoomRange: true,
        duration: 400
      });

      // Update marker position to the new city center
      if (mapPlacemarkRest && mapPlacemarkRest.geometry) {
        mapPlacemarkRest.geometry.setCoordinates(newCityCoord);
      }

      // Update restaurantForm coordinates to new city center
      setRestaurantForm((prev) => ({ ...prev, coordinates: newCityCoord }));
    } catch (error) {
      console.error('Error updating map for city change:', error);
    }
  }, [restaurantForm.city, isSearchSettingsDialogOpen, mapInstanceRest, mapPlacemarkRest]);

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
              {(user.accountType === 'restaurant' ? [
                { label: 'Video Views', value: (user.totalVideoViews || 0).toString(), icon: Eye },
                { label: 'Video Likes', value: (user.totalVideoLikes || 0).toString(), icon: ThumbsUp },
                { label: 'Videos', value: (user.restaurantVideos?.length || 0).toString(), icon: Play },
              ] : [
                { label: t('orders_count'), value: user.ordersCount.toString(), icon: History },
                { label: t('favorites'), value: user.followedRestaurants.length.toString(), icon: Heart },
                { label: t('saved'), value: user.savedCount.toString(), icon: Bell },
              ]).map((stat, i) => (
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
          </div>

          {/* Restaurant Management Section */}
          {user.accountType === 'restaurant' && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-3">
                Restaurant Management
              </h2>
              <Card className="bg-card/50 backdrop-blur border-border/40 divide-y divide-border/40">
                <button 
                  onClick={() => setIsVideoUploadDialogOpen(true)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <Upload className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Upload Video</p>
                      <p className="text-xs text-muted-foreground">Add a new cooking video</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
                <button 
                  onClick={() => setIsSearchSettingsDialogOpen(true)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-secondary/10">
                      <MapPin className="w-5 h-5 text-secondary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Search Settings</p>
                      <p className="text-xs text-muted-foreground">Manage restaurants & locations</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              </Card>

              {/* Posted Videos Section */}
              {(user.restaurantVideos && user.restaurantVideos.length > 0) && (
                <section className="mt-4">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-3">
                    Your Posted Videos
                  </h2>
                  <div className="space-y-3">
                    {user.restaurantVideos.map((video) => (
                      <motion.div key={video.id} variants={staggerItem} className="w-full">
                        <Card className="bg-card/50 backdrop-blur border-border/40 overflow-hidden">
                          <div className="flex gap-3 p-3 w-full">
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                              <img 
                                src={video.thumbnailUrl} 
                                alt="Video thumbnail"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <Play className="w-4 h-4 text-white" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{video.foodName}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">{video.caption}</p>
                              <div className="flex gap-3 text-xs font-semibold mt-1">
                                <div className="flex items-center gap-1">
                                  <Eye className="w-3 h-3 text-primary" />
                                  {video.analytics.views}
                                </div>
                                <div className="flex items-center gap-1">
                                  <ThumbsUp className="w-3 h-3 text-red-500" />
                                  {video.analytics.likes}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                user.deleteRestaurantVideo(video.id);
                                toast.success('Video deleted');
                              }}
                              className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-destructive flex-shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}

              {/* Managed Restaurants Section */}
              {(user.managedRestaurants && user.managedRestaurants.length > 0) && (
                <section className="mt-8">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-3">
                    Your Restaurants
                  </h2>
                  <div className="space-y-4">
                    {user.managedRestaurants.map((restaurant) => (
                      <motion.div key={restaurant.id} variants={staggerItem}>
                        <Card 
                          className="bg-card/50 backdrop-blur border-border/40 overflow-hidden cursor-pointer hover:bg-card/70 transition-colors"
                          onClick={() => handleViewRestaurantDetails(restaurant)}
                        >
                          <div className="flex gap-4 p-4">
                            <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                              <img 
                                src={getImageSrc(restaurant.logo, IMAGES.CHEF_COOKING_1)} 
                                alt={restaurant.name}
                                onError={() => handleImageError(restaurant.logo || '')}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="font-semibold truncate">{restaurant.name}</p>
                                  <p className="text-xs text-muted-foreground text-secondary mb-1">
                                    {restaurant.address}, {restaurant.city}
                                  </p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteRestaurant(restaurant.id);
                                  }}
                                  className="text-muted-foreground/40 hover:text-destructive transition-colors p-1 flex-shrink-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">{restaurant.description}</p>
                              {restaurant.photos && restaurant.photos.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-1 font-semibold">
                                  📷 {restaurant.photos.length} photos
                                </p>
                              )}
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}
            </section>
          )}

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
              <ProfileMenuItem 
                icon={ShieldCheck} 
                label={t('securityPrivacy')}
                onClick={() => setIsSecurityDialogOpen(true)}
              />
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

      {/* Video Upload Dialog */}
      <Dialog open={isVideoUploadDialogOpen} onOpenChange={setIsVideoUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Restaurant Video</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Video Caption</Label>
              <Textarea 
                value={videoForm.caption}
                onChange={(e) => setVideoForm({ ...videoForm, caption: e.target.value })}
                placeholder="Describe your dish and cooking process..."
                rows={3}
              />
            </div>
            <div>
              <Label>Food Item Name</Label>
              <Input 
                value={videoForm.foodName}
                onChange={(e) => setVideoForm({ ...videoForm, foodName: e.target.value })}
                placeholder="e.g., Traditional Plov"
              />
            </div>
            <div>
              <Label>Food Price (UZS)</Label>
              <Input 
                type="number"
                value={videoForm.foodPrice}
                onChange={(e) => setVideoForm({ ...videoForm, foodPrice: e.target.value })}
                placeholder="45000"
              />
            </div>
            <div>
              <Label>Upload Video</Label>
              <Input 
                type="file"
                accept="video/*"
                onChange={(e) => setVideoForm({ ...videoForm, videoFile: e.target.files?.[0] || null })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {videoForm.videoFile ? `Selected: ${videoForm.videoFile.name}` : 'No video selected'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleAddRestaurantVideo}
                className="flex-1"
              >
                Upload Video
              </Button>
              <Button 
                variant="outline"
                onClick={() => setIsVideoUploadDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Food Item Dialog */}
      <Dialog open={isAddFoodDialogOpen} onOpenChange={setIsAddFoodDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Food Item</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              <div>
                <Label>Food Name</Label>
                <Input 
                  value={foodForm.name}
                  onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                  placeholder="e.g., Wedding Plov"
                />
              </div>
              <div>
                <Label>Price (UZS)</Label>
                <Input 
                  type="number"
                  value={foodForm.price}
                  onChange={(e) => setFoodForm({ ...foodForm, price: e.target.value })}
                  placeholder="45000"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={foodForm.category} onValueChange={(value) => setFoodForm({ ...foodForm, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Main Dish">Main Dish</SelectItem>
                    <SelectItem value="Appetizer">Appetizer</SelectItem>
                    <SelectItem value="Grill">Grill</SelectItem>
                    <SelectItem value="Dessert">Dessert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea 
                  value={foodForm.description}
                  onChange={(e) => setFoodForm({ ...foodForm, description: e.target.value })}
                  placeholder="Describe your dish..."
                  rows={2}
                />
              </div>
              <div>
                <Label>Ingredients & Weight</Label>
                <Textarea 
                  value={foodForm.ingredients}
                  onChange={(e) => setFoodForm({ ...foodForm, ingredients: e.target.value })}
                  placeholder="e.g., 200g lamb, 100g carrots, 50g oil"
                  rows={3}
                />
              </div>
              <div>
                <Label>Preparation Method</Label>
                <Textarea 
                  value={foodForm.preparation}
                  onChange={(e) => setFoodForm({ ...foodForm, preparation: e.target.value })}
                  placeholder="e.g., Cooked for 45 minutes over charcoal"
                  rows={3}
                />
              </div>
            </div>
          </ScrollArea>
          <div className="flex gap-2">
            <Button 
              onClick={handleAddRestaurantFoodItem}
              className="flex-1"
            >
              Add Food Item
            </Button>
            <Button 
              variant="outline"
              onClick={() => setIsAddFoodDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search Settings Dialog */}
      <Dialog open={isSearchSettingsDialogOpen} onOpenChange={setIsSearchSettingsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Restaurant Search Settings</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              <div>
                <Label>Restaurant Name</Label>
                <Input 
                  value={restaurantForm.name}
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, name: e.target.value })}
                  placeholder="e.g., My Restaurant"
                />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input 
                  value={restaurantForm.phone}
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, phone: e.target.value })}
                  placeholder="+998 (97) 123-45-67"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea 
                  value={restaurantForm.description}
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, description: e.target.value })}
                  placeholder="Describe your restaurant..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Restaurant Logo</Label>
                <Input 
                  type="file"
                  accept="image/*"
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, logo: e.target.files?.[0] || null })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {restaurantForm.logo ? `Selected: ${restaurantForm.logo.name}` : 'No logo selected'}
                </p>
              </div>
              <div>
                <Label>Restaurant Photos (Multiple)</Label>
                <Input 
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, photos: Array.from(e.target.files || []) })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {restaurantForm.photos.length > 0 ? `${restaurantForm.photos.length} photo(s) selected` : 'No photos selected'}
                </p>
              </div>

              {/* Location Section */}
              <div>
                <Label>City</Label>
                <Select value={restaurantForm.city} onValueChange={(value) => setRestaurantForm({ ...restaurantForm, city: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tashkent">Tashkent</SelectItem>
                    <SelectItem value="Samarkand">Samarkand</SelectItem>
                    <SelectItem value="Bukhara">Bukhara</SelectItem>
                    <SelectItem value="Andijan">Andijan</SelectItem>
                    <SelectItem value="Namangan">Namangan</SelectItem>
                    <SelectItem value="Fergana">Fergana</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full">
                <Label>Precise Location (on map)</Label>
                {isSearchSettingsDialogOpen && (
                  <div 
                    id="yandex-map-restaurant" 
                    style={{ 
                      width: '100%', 
                      height: 'clamp(200px, 50vh, 350px)',
                      borderRadius: '8px', 
                      overflow: 'hidden', 
                      backgroundColor: '#f0f0f0'
                    }}
                    className="border border-border/40 mt-2"
                  />
                )}
                <p className="text-xs text-muted-foreground mt-2">Click on the map to select restaurant location</p>
              </div>

              <div>
                <Label>Address Details</Label>
                <Input 
                  value={restaurantForm.address}
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, address: e.target.value })}
                  placeholder="Enter address (street, building, apartment, etc.)"
                />
              </div>
            </div>
          </ScrollArea>
          <div className="flex gap-2">
            <Button 
              onClick={handleAddRestaurant}
              className="flex-1"
            >
              Save Restaurant
            </Button>
            <Button 
              variant="outline"
              onClick={() => setIsSearchSettingsDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Restaurant Details & Edit Dialog */}
      <Dialog open={isRestaurantDetailsOpen} onOpenChange={setIsRestaurantDetailsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Restaurant Details & Edit</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              <div>
                <Label>Restaurant Name</Label>
                <Input 
                  value={restaurantForm.name}
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, name: e.target.value })}
                  placeholder="e.g., My Restaurant"
                />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input 
                  value={restaurantForm.phone}
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, phone: e.target.value })}
                  placeholder="+998 (97) 123-45-67"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea 
                  value={restaurantForm.description}
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, description: e.target.value })}
                  placeholder="Describe your restaurant..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>City</Label>
                  <Select value={restaurantForm.city} onValueChange={(value) => setRestaurantForm({ ...restaurantForm, city: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tashkent">Tashkent</SelectItem>
                      <SelectItem value="Samarkand">Samarkand</SelectItem>
                      <SelectItem value="Bukhara">Bukhara</SelectItem>
                      <SelectItem value="Andijan">Andijan</SelectItem>
                      <SelectItem value="Namangan">Namangan</SelectItem>
                      <SelectItem value="Fergana">Fergana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Address</Label>
                  <Input 
                    value={restaurantForm.address}
                    onChange={(e) => setRestaurantForm({ ...restaurantForm, address: e.target.value })}
                    placeholder="Street address"
                  />
                </div>
              </div>

              {/* Update Logo */}
              <div>
                <Label>Update Logo</Label>
                <Input 
                  type="file"
                  accept="image/*"
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, logo: e.target.files?.[0] || null })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {restaurantForm.logo ? `Selected: ${restaurantForm.logo.name}` : 'Current logo will be kept'}
                </p>
              </div>

              {/* Current Logo Preview */}
              {selectedRestaurant?.logo && (
                <div>
                  <Label className="text-xs font-semibold">Current Logo</Label>
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden mt-2">
                    <img 
                      src={getImageSrc(selectedRestaurant.logo, IMAGES.CHEF_COOKING_1)} 
                      alt="Current logo"
                      onError={() => handleImageError(selectedRestaurant.logo || '')}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Add Photos */}
              <div>
                <Label>Add More Photos</Label>
                <Input 
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, photos: Array.from(e.target.files || []) })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {restaurantForm.photos.length > 0 ? `${restaurantForm.photos.length} new photo(s) to add` : 'No new photos selected'}
                </p>
              </div>

              {/* Current Photos Gallery */}
              {selectedRestaurant?.photos && selectedRestaurant.photos.length > 0 && (
                <div>
                  <Label className="text-xs font-semibold">Current Photos ({selectedRestaurant.photos.length})</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {selectedRestaurant.photos.map((photo: string, idx: number) => (
                      <div key={idx} className="relative rounded-lg overflow-hidden group">
                        <img 
                          src={getImageSrc(photo, IMAGES.UZBEK_FOOD_1)} 
                          alt={`Photo ${idx + 1}`}
                          onError={() => handleImageError(photo || '')}
                          className="w-full h-24 object-cover"
                        />
                        <button
                          onClick={() => handleDeletePhoto(idx)}
                          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          <X className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="flex gap-2">
            <Button 
              onClick={handleUpdateRestaurant}
              className="flex-1"
            >
              Save Changes
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setIsRestaurantDetailsOpen(false);
                setEditingRestaurantId(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

      {/* Security & Privacy Dialog */}
      <Dialog open={isSecurityDialogOpen} onOpenChange={setIsSecurityDialogOpen}>
        <DialogContent className="zone-exclusive">
          <DialogHeader>
            <DialogTitle>Security & Privacy</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Button
              onClick={() => {
                setIsSecurityDialogOpen(false);
                setIsChangePasswordDialogOpen(true);
              }}
              className="w-full"
              variant="outline"
            >
              Change Password
            </Button>
            <Button
              onClick={() => {
                setIsSecurityDialogOpen(false);
                setIsDeleteAccountDialogOpen(true);
              }}
              className="w-full"
              variant="destructive"
            >
              Delete Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={isDeleteAccountDialogOpen} onOpenChange={setIsDeleteAccountDialogOpen}>
        <DialogContent className="zone-exclusive">
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. Your account and all associated data will be permanently deleted.
            </p>
            <div>
              <Label htmlFor="delete-password">Enter your password to confirm</Label>
              <Input
                id="delete-password"
                type="password"
                placeholder="Password"
                value={deleteAccountPassword}
                onChange={(e) => setDeleteAccountPassword(e.target.value)}
                className="mt-2"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setIsDeleteAccountDialogOpen(false);
                  setDeleteAccountPassword('');
                  setIsSecurityDialogOpen(true);
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteAccount}
                variant="destructive"
                className="flex-1"
              >
                Delete Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isChangePasswordDialogOpen} onOpenChange={setIsChangePasswordDialogOpen}>
        <DialogContent className="zone-exclusive">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                placeholder="Current password"
                value={changePasswordForm.currentPassword}
                onChange={(e) =>
                  setChangePasswordForm({ ...changePasswordForm, currentPassword: e.target.value })
                }
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="New password"
                value={changePasswordForm.newPassword}
                onChange={(e) =>
                  setChangePasswordForm({ ...changePasswordForm, newPassword: e.target.value })
                }
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm password"
                value={changePasswordForm.confirmPassword}
                onChange={(e) =>
                  setChangePasswordForm({ ...changePasswordForm, confirmPassword: e.target.value })
                }
                className="mt-2"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setIsChangePasswordDialogOpen(false);
                  setChangePasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setIsSecurityDialogOpen(true);
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleChangePassword} className="flex-1">
                Change Password
              </Button>
            </div>
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
