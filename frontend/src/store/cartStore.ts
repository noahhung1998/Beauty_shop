import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product } from '@/types';

// ============================================================
// Cart store with localStorage persistence
// ============================================================

const IVA_RATE = 0.21; // 21% IVA estándar for Spain

interface CartState {
  items: CartItem[];
  isOpen: boolean;

  // Actions
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // Computed
  itemCount: () => number;
  subtotalNeto: () => number;
  ivaAmount: () => number;
  total: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product: Product, quantity = 1) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) => item.product.id === product.id,
          );

          if (existingIndex >= 0) {
            const newItems = [...state.items];
            newItems[existingIndex] = {
              ...newItems[existingIndex],
              quantity: newItems[existingIndex].quantity + quantity,
            };
            return { items: newItems, isOpen: true };
          }

          return {
            items: [...state.items, { product, quantity }],
            isOpen: true,
          };
        });
      },

      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        }));
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item,
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      // Computed values as methods
      itemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      subtotalNeto: () => {
        return get().items.reduce((sum, item) => {
          // Price stored is with IVA, calculate neto
          const netoPrice = item.product.price / (1 + IVA_RATE);
          return sum + netoPrice * item.quantity;
        }, 0);
      },

      ivaAmount: () => {
        return get().subtotalNeto() * IVA_RATE;
      },

      total: () => {
        // Total equals sum of prices (which already include IVA)
        return get().items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0,
        );
      },
    }),
    {
      name: 'cart-storage',
      // Only persist items, not UI state
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
