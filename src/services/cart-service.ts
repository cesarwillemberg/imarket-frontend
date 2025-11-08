import { supabase } from "../lib/supabase";

interface Cart {
  profile_id: string;
  is_active: boolean;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

interface CartItem {
  cart_id: string;
  store_id: string;
  produto_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  checked: boolean;
  created_at: string;
  updated_at: string;
}

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

  getCartItemCheckedByCart: async (cartId: string) => {
    try {
      const { data, error } = await supabase
        .from("cart_item")
        .select("*")
        .eq("cart_id", cartId)
        .eq("checked", true);

      if (error) {
        console.error("cartService: erro ao buscar itens do carrinho marcados:", error);
        return { data: null, error };
      }
      return { data, error: null };
    } catch (error) {
      console.error("cartService: erro ao buscar itens do carrinho marcados:", error);
      return { data: null, error };
    }
  },

  setCartItemChecked: async (cartId: string, produtoId: string, checked: boolean) => {
    try {
      const { data, error } = await supabase
        .from("cart_item")
        .update({ checked })
        .eq("cart_id", cartId)
        .eq("produto_id", produtoId)
        .select("*")
        .single();

      if (error) {
        console.error("cartService: erro ao atualizar item do carrinho:", error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error("cartService: erro ao atualizar item do carrinho:", error);
      return { data: null, error };
    }
  },

  createCartByUserId: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("cart")
        // database column is `profile_id` (see Cart interface) — use the same column when creating
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

  getCartItemsByCartId: async (cartId: string, userId: string) => {
    try {
      const { data, error } = await supabase
        .from("cart_item")
        .select("*")
        .eq("cart_id", cartId)

      if (error) {
        console.error("cartService: erro ao buscar itens do carrinho:", error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error("cartService: erro ao buscar itens do carrinho:", error);
      return { data: null, error };
    }
  },

  addItemToCart: async (input: {
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
        .eq("cart_id", input.cart_id)
        .eq("produto_id", input.produto_id)
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

        const newQuantity = previousQuantity + input.quantity;

        const { data, error } = await supabase
          .from("cart_item")
          .update({
            quantity: newQuantity,
            unit_price: input.unit_price,
          })
          .eq("cart_id", input.cart_id)
          .eq("produto_id", input.produto_id)
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
            cart_id: input.cart_id,
            store_id: input.store_id,
            produto_id: input.produto_id,
            quantity: input.quantity,
            unit_price: input.unit_price,
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

  updateItemQuantity: async (input: {
    userId: string;
    cart_id: string;
    produto_id: string;
    quantity: number;
  }) => {
    try {
      const { data, error } = await supabase
        .from("cart_item")
        .update({
          quantity: input.quantity,
        })
        .eq("cart_id", input.cart_id)
        .eq("produto_id", input.produto_id)
        .select("*")
        .single();

      if (error) {
        console.error("cartService: erro ao atualizar quantidade do item:", error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error("cartService: erro ao atualizar quantidade do item:", error);
      return { data: null, error };
    }
  },

  removeItemFromCart: async (input: {
    userId: string;
    cart_id: string;
    produto_id: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from("cart_item")
        .delete()
        .eq("cart_id", input.cart_id)
        .eq("produto_id", input.produto_id);

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
