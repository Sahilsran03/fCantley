import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api.js";
import { useAuth } from "./AuthContext.jsx";

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setProducts([]);
      return [];
    }

    setIsLoading(true);
    try {
      const response = await api.get("/wishlist");
      setProducts(response.data.wishlist.products || []);
      return response.data.wishlist.products || [];
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadWishlist().catch(() => setProducts([]));
  }, [loadWishlist]);

  const isWishlisted = useCallback(
    (productId) => products.some((product) => product._id === productId || product === productId),
    [products]
  );

  const toggleWishlist = useCallback(
    async (productId) => {
      const exists = products.some((product) => product._id === productId || product === productId);
      const response = exists ? await api.delete(`/wishlist/${productId}`) : await api.post(`/wishlist/${productId}`);
      setProducts(response.data.wishlist.products || []);
      return !exists;
    },
    [products]
  );

  const value = useMemo(
    () => ({
      products,
      count: products.length,
      isLoading,
      isWishlisted,
      loadWishlist,
      toggleWishlist
    }),
    [isLoading, isWishlisted, loadWishlist, products, toggleWishlist]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider.");
  }

  return context;
};
