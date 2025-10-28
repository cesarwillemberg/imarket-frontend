import { supabase } from "../lib/supabase";

const productService = {

    getProducts: async() => {
        try {
            const { data, error } = await supabase
                .from("product")
                .select("*");

            if (error) {
                console.error("Error fetching products:", error);
                return { data: null, error };
            }

            return { data, error: null };
        } catch (error) {
            console.error("Error fetching products:", error);
            return { data: null, error };
        }
    },

    getProductsByStoreId: async(storeId: string) => {
        try {
            const { data, error } = await supabase
                .from("product")
                .select("*")
                .eq("store_id", storeId);

            if (error) {
                console.error("Error fetching products by store ID:", error);
                return { data: null, error };
            }

            return { data, error: null };
        } catch (error) {
            console.error("Error fetching products by store ID:", error);
            return { data: null, error };
        }
    },

    getProductById: async (id: string) => {
        try {
            const { data, error } = await supabase
                .from("product")
                .select("*")
                .eq("id", id)
                .single();

            if (error) {
                console.error("Error fetching product by ID:", error);
                return { data: null, error };
            }

            return { data, error: null };
        } catch (error) {
            console.error("Error fetching product by ID:", error);
            return { data: null, error };
        }
    },

    getImageProduct: async (productId: string) => {
        try {
            const { data, error } = await supabase
                .from("product_image")
                .select("*")
                .eq("product_id", productId);

            if (error) {
                console.error("Error fetching images for product:", error);
                return { data: null, error };
            }

            return { data, error: null };
        } catch (error) {
            console.error("Error fetching images for product:", error);
            return { data: null, error };
        }
    },

    getItemPromotionByStore: async (storeId: string) => {
        try {
            const { data, error } = await supabase
                .from("product")
                .select("*")
                .eq("store_id", storeId)
                .eq("in_promotion", true);

            if (error) {
                console.error("Error fetching promotional products:", error);
                return { data: null, error };
            }

            return { data, error: null };
        } catch (error) {
            console.error("Error fetching promotional products:", error);
            return { data: null, error };
        }
    }






}


export default productService;
