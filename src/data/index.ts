import { IMAGES } from '@/assets/images';
import { 
  Restaurant, 
  FoodItem, 
  VideoFeed, 
  User 
} from '@/lib/index';

export const mockRestaurants: Restaurant[] = [
  {
    id: 'res-1',
    name: 'Chorsu Heritage Grill',
    logo: IMAGES.CHEF_COOKING_1,
    rating: 4.8,
    deliveryTime: '25-35 min',
    category: 'Uzbek Traditional',
    location: 'Tashkent, Shaykhantakhur District',
    description: 'Authentic Uzbek grill and traditional cuisine from the heart of Chorsu.'
  },
  {
    id: 'res-2',
    name: 'Samarkand Plov Center',
    logo: IMAGES.CHEF_COOKING_2,
    rating: 4.9,
    deliveryTime: '20-30 min',
    category: 'National Food',
    location: 'Samarkand, University Boulevard',
    description: 'Award-winning Samarkand plov cooked daily in traditional giant cauldrons.'
  },
  {
    id: 'res-3',
    name: 'Tashkent Urban Eats',
    logo: IMAGES.APP_INTERFACE_3,
    rating: 4.5,
    deliveryTime: '15-25 min',
    category: 'Modern Fusion',
    location: 'Tashkent, Mirabad District',
    description: 'Modern takes on traditional favorites and international street food.'
  }
];

export const mockFoodItems: FoodItem[] = [
  {
    id: 'food-1',
    restaurantId: 'res-2',
    name: 'Wedding Plov Special',
    price: 45000,
    description: 'Traditional Samarkand plov with tender lamb, yellow carrots, and spices.',
    image: IMAGES.UZBEK_FOOD_3,
    category: 'Main Dish',
    isAvailable: true
  },
  {
    id: 'food-2',
    restaurantId: 'res-1',
    name: 'Mixed Shashlik Platter',
    price: 68000,
    description: 'Assortment of lamb, beef, and chicken kebabs grilled over apricot wood.',
    image: IMAGES.UZBEK_FOOD_8,
    category: 'Grill',
    isAvailable: true
  },
  {
    id: 'food-3',
    restaurantId: 'res-3',
    name: 'Silk Road Somsa Trio',
    price: 32000,
    description: 'Hand-crafted pastry filled with minced beef, pumpkin, and mountain herbs.',
    image: IMAGES.UZBEK_FOOD_5,
    category: 'Appetizer',
    isAvailable: true
  }
];

export const mockVideoFeeds: VideoFeed[] = [
  {
    id: 'vid-1',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-fresh-food-is-prepared-in-a-pan-34563-large.mp4',
    thumbnailUrl: IMAGES.FOOD_VIDEOS_1,
    restaurantId: 'res-2',
    foodItemId: 'food-1',
    caption: 'The secret is in the layering! Best Wedding Plov in Tashkent. 🔥 #UzbekFood #PlovLife #OrderUZ',
    likes: 12400,
    shares: 850,
    userHasLiked: false,
    userHasSaved: true,
    restaurantName: 'Samarkand Plov Center',
    foodName: 'Wedding Plov Special',
    foodPrice: 45000
  },
  {
    id: 'vid-2',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-cooking-a-steak-in-a-pan-in-slow-motion-34560-large.mp4',
    thumbnailUrl: IMAGES.FOOD_VIDEOS_2,
    restaurantId: 'res-1',
    foodItemId: 'food-2',
    caption: 'Nothing beats charcoal grill aroma. Shashlik masterclass! 🍢✨ #GrillMaster #Chorsu #OrderUZ',
    likes: 8900,
    shares: 420,
    userHasLiked: true,
    userHasSaved: false,
    restaurantName: 'Chorsu Heritage Grill',
    foodName: 'Mixed Shashlik Platter',
    foodPrice: 68000
  },
  {
    id: 'vid-3',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-chef-preparing-a-dish-with-vegetables-and-meat-34567-large.mp4',
    thumbnailUrl: IMAGES.FOOD_VIDEOS_3,
    restaurantId: 'res-3',
    foodItemId: 'food-3',
    caption: 'Handmade with love. Our Somsa is a piece of art. 🥟💛 #Somsa #TashkentEats #Crispy',
    likes: 5600,
    shares: 1100,
    userHasLiked: false,
    userHasSaved: false,
    restaurantName: 'Tashkent Urban Eats',
    foodName: 'Silk Road Somsa Trio',
    foodPrice: 32000
  }
];

export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Aziz Rakhimov',
    avatar: 'https://i.pravatar.cc/150?u=aziz',
    email: 'aziz.r@orderuz.com',
    phone: '+998 90 123 45 67',
    address: '12 Amir Temur Avenue, Tashkent, Uzbekistan',
    favoriteRestaurants: ['res-1', 'res-2'],
    savedVideos: ['vid-1']
  },
  {
    id: 'user-2',
    name: 'Nigora Sultanova',
    avatar: 'https://i.pravatar.cc/150?u=nigora',
    email: 'nigora.s@orderuz.com',
    phone: '+998 97 987 65 43',
    address: '45 Navoi Street, Samarkand, Uzbekistan',
    favoriteRestaurants: ['res-2'],
    savedVideos: ['vid-1', 'vid-3']
  }
];