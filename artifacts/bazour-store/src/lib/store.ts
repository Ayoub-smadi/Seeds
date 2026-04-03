import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, User } from '@workspace/api-client-react';

type Language = 'en' | 'ar';

interface AppState {
  lang: Language;
  theme: 'light' | 'dark';
  setLang: (lang: Language) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      lang: 'ar',
      theme: 'light',
      setLang: (lang) => {
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
        set({ lang });
      },
      setTheme: (theme) => {
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        set({ theme });
      },
    }),
    { name: 'bazour-settings' }
  )
);

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  addItem: (product: Product, quantity?: number) => boolean;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemQuantity: (productId: string) => number;
}

// Client-side cart store (optimistic UI for the real backend cart)
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      setIsOpen: (isOpen) => set({ isOpen }),
      addItem: (product, quantity = 1) => {
        const maxQty = typeof product.quantity === 'number' ? product.quantity : Infinity;
        if (maxQty === 0) return false;
        const state = get();
        const existing = state.items.find((i) => i.product.id === product.id);
        const currentQty = existing?.quantity ?? 0;
        if (currentQty >= maxQty) return false;
        const newQty = Math.min(currentQty + quantity, maxQty);
        if (existing) {
          set({
            items: state.items.map((i) =>
              i.product.id === product.id ? { ...i, quantity: newQty } : i
            ),
            isOpen: true,
          });
        } else {
          set({ items: [...state.items, { product, quantity: Math.min(quantity, maxQty) }], isOpen: true });
        }
        return newQty === currentQty + quantity;
      },
      removeItem: (productId) => set((state) => ({
        items: state.items.filter((i) => i.product.id !== productId),
      })),
      updateQuantity: (productId, quantity) => set((state) => ({
        items: state.items.map((i) => {
          if (i.product.id !== productId) return i;
          const maxQty = typeof i.product.quantity === 'number' ? i.product.quantity : Infinity;
          return { ...i, quantity: Math.min(Math.max(1, quantity), maxQty) };
        }),
      })),
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        const state = get();
        return state.items.reduce((total, item) => total + ((item.product.onSale && item.product.salePrice ? item.product.salePrice : item.product.price) * item.quantity), 0);
      },
      getItemQuantity: (productId) => {
        const state = get();
        return state.items.find(i => i.product.id === productId)?.quantity ?? 0;
      },
    }),
    { name: 'bazour-cart' }
  )
);
