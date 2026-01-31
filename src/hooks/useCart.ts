import { useState, useEffect } from 'react';
import { FoodItem, CartItem } from '@/lib';

/**
 * OrderUZ Cart Hook
 * Manages the global state of the shopping cart using a singleton pattern
 * to ensure consistency across video feeds and the cart drawer.
 */

// Internal singleton state to persist cart data across component mounts
let cartStore: CartItem[] = [];
const listeners = new Set<() => void>();

const emit = () => {
  listeners.forEach((listener) => listener());
};

export const useCart = () => {
  const [items, setItems] = useState<CartItem[]>(cartStore);

  useEffect(() => {
    const syncState = () => setItems([...cartStore]);
    listeners.add(syncState);
    return () => {
      listeners.delete(syncState);
    };
  }, []);

  /**
   * Adds a food item to the cart or increments its quantity if it already exists.
   */
  const addItem = (food: FoodItem) => {
    const existingItem = cartStore.find((item) => item.id === food.id);

    if (existingItem) {
      cartStore = cartStore.map((item) =>
        item.id === food.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      cartStore = [...cartStore, { ...food, quantity: 1 }];
    }
    emit();
  };

  /**
   * Removes an item from the cart entirely.
   */
  const removeItem = (foodId: string) => {
    cartStore = cartStore.filter((item) => item.id !== foodId);
    emit();
  };

  /**
   * Updates the quantity of a specific item in the cart.
   * If quantity reaches 0, the item is removed.
   */
  const updateQuantity = (foodId: string, delta: number) => {
    cartStore = cartStore
      .map((item) => {
        if (item.id === foodId) {
          const newQuantity = item.quantity + delta;
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
      .filter((item) => item.quantity > 0);
    emit();
  };

  /**
   * Clears all items from the cart.
   */
  const clearCart = () => {
    cartStore = [];
    emit();
  };

  // Calculation Helpers
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const isEmpty = items.length === 0;

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
    isEmpty,
  };
};
