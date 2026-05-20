import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api.js";
import { useAuth } from "./AuthContext.jsx";

const emptyCart = { items: [], itemCount: 0, subtotal: 0 };
const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(emptyCart);
  const [isLoading, setIsLoading] = useState(false);

  const loadCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(emptyCart);
      return emptyCart;
    }

    setIsLoading(true);
    try {
      const response = await api.get("/cart");
      setCart(response.data.cart);
      return response.data.cart;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadCart().catch(() => setCart(emptyCart));
  }, [loadCart]);

  const addToCart = useCallback(async (payload) => {
    const response = await api.post("/cart", payload);
    setCart(response.data.cart);
    return response.data.cart;
  }, []);

  const updateQuantity = useCallback(async (itemId, quantity) => {
    const response = await api.put(`/cart/items/${itemId}`, { quantity });
    setCart(response.data.cart);
    return response.data.cart;
  }, []);

  const removeItem = useCallback(async (itemId) => {
    const response = await api.delete(`/cart/items/${itemId}`);
    setCart(response.data.cart);
    return response.data.cart;
  }, []);

  const clearCart = useCallback(async () => {
    const response = await api.delete("/cart");
    setCart(response.data.cart);
    return response.data.cart;
  }, []);

  const applyCoupon = useCallback(async (code) => {
    const response = await api.post("/coupons/validate", { code });
    await loadCart();
    return response.data.pricing;
  }, [loadCart]);

  const value = useMemo(
    () => ({
      cart,
      isLoading,
      loadCart,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
      applyCoupon
    }),
    [addToCart, applyCoupon, cart, clearCart, isLoading, loadCart, removeItem, updateQuantity]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider.");
  }

  return context;
};
