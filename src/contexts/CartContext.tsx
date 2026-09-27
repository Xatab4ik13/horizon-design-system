import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  variations?: Record<string, string>;
  variationLabels?: Record<string, string>;
  dimensions?: string;
  weight?: string;
  /** Габариты/вес с упаковкой — только для оформления заказа */
  packedDimensions?: string;
  packedWeight?: string;
  areaM2?: number;
  volumeM3?: number;
  packedAreaM2?: number;
  packedVolumeM3?: number;
  /** Уникальная строка корзины: товар + выбранные параметры */
  lineId?: string;
}

export const cartLineId = (i: { productId: string; lineId?: string }) => i.lineId ?? i.productId;

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "wood-shop-cart";

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (item: Omit<CartItem, "quantity">, quantity = 1) => {
    const lineId = item.lineId ?? `${item.productId}|${JSON.stringify(item.variations ?? {})}|${item.price}`;
    setItems((prev) => {
      const existing = prev.find((i) => cartLineId(i) === lineId);
      if (existing) {
        return prev.map((i) => (cartLineId(i) === lineId ? { ...i, quantity: i.quantity + quantity } : i));
      }
      return [...prev, { ...item, lineId, quantity }];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => cartLineId(i) !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) => prev.map((i) => (cartLineId(i) === id ? { ...i, quantity } : i)));
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
