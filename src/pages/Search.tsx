import React, { useState, useMemo } from 'react';
import { Search as SearchIcon, MapPin, Star, Play, Filter, Clock, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { mockRestaurants, mockVideoFeeds } from '@/data/index';
import { IMAGES } from '@/assets/images';
import { motion } from 'framer-motion';
import { springPresets, fadeInUp, staggerContainer, staggerItem } from '@/lib/motion';
import { useUserStore } from '@/store/userStore';
import type { Restaurant, RestaurantProfile } from '@/lib/index';

const CATEGORIES = [
  'All', 'Plov', 'Shashlik', 'Somsa', 'Traditional', 'Fast Food', 'Desserts', 'Drinks'
];

export default function Search() {
  const user = useUserStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
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

  // Combine mock restaurants with user's managed restaurants
  const allRestaurants = useMemo(() => {
    const managedRestaurants = (user.managedRestaurants || []).map(rest => ({
      ...rest,
      id: rest.id,
      name: rest.name,
      logo: rest.logo,
      rating: rest.rating,
      deliveryTime: rest.deliveryTime,
      category: rest.category,
      location: `${rest.address}, ${rest.city}`,
      description: rest.description,
      isManagedRestaurant: true
    } as any));
    return [...managedRestaurants, ...mockRestaurants];
  }, [user.managedRestaurants]);

  const filteredRestaurants = useMemo(() => {
    return allRestaurants.filter(res => 
      (res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.category.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (activeCategory === 'All' || res.category.includes(activeCategory))
    );
  }, [searchQuery, activeCategory, allRestaurants]);

  const filteredVideos = useMemo(() => {
    return mockVideoFeeds.filter(vid => 
      vid.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vid.foodName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <div className="h-screen bg-background pb-24 overflow-y-auto flex flex-col">
      {/* Sticky Search Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40 p-4">
        <div className="relative flex items-center gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search for plov, shashlik, or somsa..."
              className="pl-10 h-11 bg-muted/50 border-none rounded-2xl focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="p-2.5 bg-muted/50 rounded-xl hover:bg-muted transition-colors">
            <Filter className="h-5 w-5 text-foreground" />
          </button>
        </div>

        {/* Categories Horizontal Scroll */}
        <ScrollArea className="w-full whitespace-nowrap mt-4">
          <div className="flex space-x-2">
            {CATEGORIES.map((cat) => (
              <Badge
                key={cat}
                variant={activeCategory === cat ? "default" : "secondary"}
                className={`px-4 py-1.5 rounded-full cursor-pointer transition-all ${
                  activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted/50 hover:bg-muted text-muted-foreground"
                }`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="hidden" />
        </ScrollArea>
      </header>

      <main className="p-4 space-y-8">
        <Tabs defaultValue="restaurants" className="w-full">
          <TabsList className="w-full grid grid-cols-2 h-12 bg-muted/30 rounded-2xl p-1">
            <TabsTrigger value="restaurants" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">Restaurants</TabsTrigger>
            <TabsTrigger value="videos" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">Food Reels</TabsTrigger>
          </TabsList>

          {/* Restaurants Tab */}
          <TabsContent value="restaurants" className="mt-6">
            <motion.div 
              variants={staggerContainer} 
              initial="hidden" 
              animate="visible"
              className="grid grid-cols-1 gap-4"
            >
              {filteredRestaurants.length > 0 ? (
                filteredRestaurants.map((res) => (
                  <motion.div key={res.id} variants={staggerItem}>
                    <Card 
                      className="overflow-hidden border-none shadow-md bg-card/50 backdrop-blur-sm group cursor-pointer active:scale-[0.98] transition-all"
                      onClick={() => {
                        setSelectedRestaurant(res);
                        setIsRestaurantDetailsOpen(true);
                      }}
                    >
                      <CardContent className="p-0">
                        <div className="flex items-center p-3 gap-4">
                          <div className="relative h-20 w-20 rounded-2xl overflow-hidden shrink-0">
                            <img 
                              src={getImageSrc(res.logo, IMAGES.CHEF_COOKING_1)} 
                              alt={res.name} 
                              onError={() => handleImageError(res.logo || '')}
                              className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" 
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg truncate">{res.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                              <span className="flex items-center gap-1 text-primary">
                                <Star className="h-3.5 w-3.5 fill-primary" />
                                {res.rating}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {res.deliveryTime}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{res.location}</span>
                            </div>
                          </div>
                          <div className="p-2">
                            <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-20 opacity-50">
                  <img src={IMAGES.CHEF_COOKING_3} alt="Empty" className="w-32 mx-auto mb-4 rounded-full grayscale opacity-50" />
                  <p className="text-lg font-medium">No restaurants found</p>
                  <p className="text-sm">Try searching for something else</p>
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="mt-6">
            <div className="grid grid-cols-2 gap-3">
              {filteredVideos.map((vid) => (
                <motion.div 
                  key={vid.id} 
                  variants={fadeInUp} 
                  initial="initial" 
                  animate="animate"
                  className="relative aspect-[9/16] rounded-2xl overflow-hidden group cursor-pointer"
                >
                  <img 
                    src={vid.thumbnailUrl} 
                    alt={vid.caption} 
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-3 bg-white/20 backdrop-blur-md rounded-full">
                      <Play className="h-8 w-8 text-white fill-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white text-sm font-semibold line-clamp-2">{vid.caption}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <img src={IMAGES.UZBEK_FOOD_5} className="h-4 w-4 rounded-full" alt="" />
                      <span className="text-white/80 text-xs">{vid.restaurantName}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Trending Searches Section */}
        {!searchQuery && (
          <section className="space-y-4 pt-4">
            <h2 className="text-xl font-bold px-1">Trending Now</h2>
            <div className="flex flex-wrap gap-2">
              {['Wedding Plov', 'Juicy Shashlik', 'Crispy Somsa', 'Ayran', 'Baklava'].map(tag => (
                <button 
                  key={tag} 
                  onClick={() => setSearchQuery(tag)}
                  className="px-4 py-2 bg-muted/30 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Promotion Banner */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="relative h-32 rounded-3xl overflow-hidden mt-8 shadow-xl"
        >
          <img src={IMAGES.UZBEK_FOOD_3} className="absolute inset-0 w-full h-full object-cover" alt="Promotion" />
          <div className="absolute inset-0 bg-primary/40 backdrop-blur-[2px]" />
          <div className="absolute inset-0 flex flex-col justify-center px-6">
            <h3 className="text-white text-2xl font-black">FREE DELIVERY</h3>
            <p className="text-white/90 font-medium">On all orders above 100,000 UZS</p>
          </div>
        </motion.div>
      </main>

      {/* Restaurant Details Dialog */}
      <Dialog open={isRestaurantDetailsOpen} onOpenChange={setIsRestaurantDetailsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedRestaurant?.name}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {/* Logo */}
              <div>
                <Label className="text-xs font-semibold">Logo</Label>
                <div className="relative w-full h-40 rounded-lg overflow-hidden mt-2 bg-muted">
                  <img 
                    src={getImageSrc(selectedRestaurant?.logo, IMAGES.CHEF_COOKING_1)}
                    alt={selectedRestaurant?.name}
                    onError={() => handleImageError(selectedRestaurant?.logo || '')}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Rating</p>
                  <p className="flex items-center gap-1 font-semibold">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    {selectedRestaurant?.rating} / 5.0
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Delivery Time</p>
                  <p className="flex items-center gap-1 font-semibold">
                    <Clock className="h-4 w-4" />
                    {selectedRestaurant?.deliveryTime}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Location</p>
                  <p className="flex items-center gap-1 text-sm">
                    <MapPin className="h-4 w-4" />
                    {selectedRestaurant?.location}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className="text-xs font-semibold">Description</Label>
                <p className="text-sm text-muted-foreground mt-1">{selectedRestaurant?.description}</p>
              </div>

              {/* Photos Gallery */}
              {selectedRestaurant && typeof selectedRestaurant === 'object' && 'photos' in selectedRestaurant && selectedRestaurant.photos && selectedRestaurant.photos.length > 0 ? (
                <div>
                  <Label className="text-xs font-semibold">Photos ({selectedRestaurant.photos.length})</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {selectedRestaurant.photos.map((photo: string, idx: number) => (
                      <div key={idx} className="relative rounded-lg overflow-hidden bg-muted">
                        <img 
                          src={getImageSrc(photo, IMAGES.UZBEK_FOOD_1)}
                          alt={`Photo ${idx + 1}`}
                          onError={() => handleImageError(photo || '')}
                          className="w-full h-32 object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No additional photos available</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
