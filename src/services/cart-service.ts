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
      const { data: existingItem, error: existingError } = await supabase
        .from("cart_item")
        .select("quantity")
        .eq("cart_id", inputProduct.cart_id)
        .eq("produto_id", inputProduct.produto_id)
        // .eq("profile_id", inputProduct.userId)
        .maybeSingle();

      if (existingError) {
        console.error("cartService: erro ao verificar item existente no carrinho:", existingError);
        return { data: null, error: existingError };
      }

      if (existingItem) {
        const previousQuantity =
          typeof existingItem.quantity === "number"
            ? existingItem.quantity
            : Number(existingItem.quantity ?? 0);

        const newQuantity = previousQuantity + inputProduct.quantity;

        const { data, error } = await supabase
          .from("cart_item")
          .update({
            quantity: newQuantity,
            unit_price: inputProduct.unit_price,
          })
          .eq("cart_id", inputProduct.cart_id)
          .eq("produto_id", inputProduct.produto_id)
          // .eq("profile_id", inputProduct.userId)
          .select("*")
          .single();

        if (error) {
          console.error("cartService: erro ao atualizar quantidade do item:", error);
          return { data: null, error };
        }

        return { data, error: null };
      }

      const { data, error } = await supabase
        .from("cart_item")
        .insert([
          {
            // profile_id: inputProduct.userId,
            cart_id: inputProduct.cart_id,
            store_id: inputProduct.store_id,
            produto_id: inputProduct.produto_id,
            quantity: inputProduct.quantity,
            unit_price: inputProduct.unit_price,
          },
        ])
        .select("*")
        .single();

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
        // .eq("profile_id", userId)
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
