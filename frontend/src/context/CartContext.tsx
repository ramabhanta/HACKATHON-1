import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  productId: string;
  name: string;
  brand: string;
  price: number;
  packSize: string;
  image: string;
  vendorId: string;
  vendorName: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: any, qty?: number) => void;
  updateQuantity: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('agri_cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('agri_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: any, qty: number = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i =>
          i.productId === product.id ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          brand: product.brand,
          price: product.price,
          packSize: product.packSize,
          image: product.images?.[0] || 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=300',
          vendorId: product.vendorId || 'usr-vendor-1',
          vendorName: product.vendorName || 'Sri Lakshmi Agri Inputs',
          quantity: qty
        }
      ];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setItems(prev =>
      prev
        .map(i => {
          if (i.productId === productId) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);
  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const deliveryFee = subtotal > 1500 || subtotal === 0 ? 0 : 50;
  const totalAmount = subtotal + deliveryFee;

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItems,
        subtotal,
        deliveryFee,
        totalAmount
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
