import { supabase } from "../lib/supabase";

const cartService = {
    getCartByUserId: async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from("cart")
                .select("*")
                .eq("user_id", userId)
                .eq("is_active", true)
                .single();

            if (error) {
                console.error("❌ Erro ao obter o carrinho:", error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error("❌ Erro ao obter o carrinho:", error);
            throw error;
        }
    },

    addItemToCart: async (inputProduct: {
        userId: string;
        cart_id: string;
        store_id: string;
        produto_id: string;
        quantity: number;
        unit_price: number;
        total_price: number;
    }) => {
        try {
            const { data, error } = await supabase
                .from("cart_item")
                .insert([{
                    user_id: inputProduct.userId,
                    cart_id: inputProduct.cart_id,
                    store_id: inputProduct.store_id,
                    product_id: inputProduct.produto_id,
                    quantity: inputProduct.quantity,
                    unit_price: inputProduct.unit_price,
                    total_price: inputProduct.total_price
                }]);

            if (error) {
                console.error("❌ Erro ao adicionar item ao carrinho:", error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error("❌ Erro ao adicionar item ao carrinho:", error);
            throw error;
        }
    },

    removeItemFromCart: async (userId: string, productId: string) => {
        try {
            const { data, error } = await supabase
                .from("cart_item")
                .delete()
                .eq("user_id", userId)
                .eq("produto_id", productId);

            if (error) {
                console.error("❌ Erro ao remover item do carrinho:", error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error("❌ Erro ao remover item do carrinho:", error);
            throw error;
        }
    }

}

export default cartService;