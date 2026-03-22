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
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

// Client-side cart store (optimistic UI for the real backend cart)
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      setIsOpen: (isOpen) => set({ isOpen }),
      addItem: (product, quantity = 1) => set((state) => {
        const existing = state.items.find((i) => i.product.id === product.id);
        if (existing) {
          return {
            items: state.items.map((i) =>
              i.product.id === product.id
                ? { ...i, quantity: i.quantity + quantity }
                : i
            ),
            isOpen: true,
          };
        }
        return { items: [...state.items, { product, quantity }], isOpen: true };
      }),
      removeItem: (productId) => set((state) => ({
        items: state.items.filter((i) => i.product.id !== productId),
      })),
      updateQuantity: (productId, quantity) => set((state) => ({
        items: state.items.map((i) =>
          i.product.id === productId ? { ...i, quantity } : i
        ),
      })),
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        const state = get();
        return state.items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
      },
    }),
    { name: 'bazour-cart' }
  )
);
