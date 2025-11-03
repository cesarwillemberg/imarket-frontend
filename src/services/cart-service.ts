import { supabase } from "../lib/supabase";

const cartService = {
  getCartByUserId: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("cart")
        .select("*")
        .eq("profile_id", userId)
        .eq("is_active", true)
        .limit(1);

      if (error) {
        console.error("cartService: erro ao obter o carrinho ativo:", error);
        return { data: null, error };
      }

      const cart =
        Array.isArray(data) && data.length > 0
          ? data[0]
          : Array.isArray(data)
          ? null
          : data ?? null;

      return { data: cart, error: null };
    } catch (error) {
      console.error("cartService: erro ao obter o carrinho ativo:", error);
      return { data: null, error };
    }
  },

  createCartByUserId: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("cart")
        .insert([{ profile_id: userId, is_active: true }])
        .select("*")
        .single();

      if (error) {
        console.error("cartService: erro ao criar o carrinho:", error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error("cartService: erro ao criar o carrinho:", error);
      return { data: null, error };
    }
  },

  getOrCreateActiveCart: async (userId: string) => {
    const { data, error } = await cartService.getCartByUserId(userId);

    if (error) {
      return { data: null, error };
    }

    if (data) {
      return { data, error: null };
    }

    return cartService.createCartByUserId(userId);
  },

  addItemToCart: async (inputProduct: {
    userId: string;
    cart_id: string;
    store_id: string;
    produto_id: string;
    quantity: number;
    unit_price: number;
    total_price?: number;
  }) => {
    try {
      const { data, error } = await supabase
        .from("cart_item")
        .insert([
          {
            // user_id: inputProduct.userId,
              cart_id: inputProduct.cart_id,
              store_id: inputProduct.store_id,
              produto_id: inputProduct.produto_id,
              quantity: inputProduct.quantity,
              unit_price: inputProduct.unit_price,
            },
          ]);

      if (error) {
        console.error("cartService: erro ao adicionar item ao carrinho:", error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error("cartService: erro ao adicionar item ao carrinho:", error);
      return { data: null, error };
    }
  },

  removeItemFromCart: async (userId: string, productId: string) => {
    try {
      const { data, error } = await supabase
        .from("cart_item")
        .delete()
        .eq("profile_id", userId)
        .eq("produto_id", productId);

      if (error) {
        console.error("cartService: erro ao remover item do carrinho:", error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error("cartService: erro ao remover item do carrinho:", error);
      return { data: null, error };
    }
  },
};

export default cartService;
