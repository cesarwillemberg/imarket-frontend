import { supabase } from "../lib/supabase";

const storeService = {
    getStores: async () => {
        try {
            const { data, error } = await supabase
            .from("store")
            .select("*");


            if (error) {
                console.error("Error fetching stores:", error);
                return { data: null, error };
            }

            return { data, error: null };

        } catch (error) {
            console.error("Error fetching stores:", error);
            return { data: null, error };
        }
    },

    getStoreById: async (id: string) => {
        try {
            const { data, error } = await supabase
                .from("store")
                .select("*")
                .eq("id", id)
                .single();

            if (error) {
                console.error("Error fetching store by ID:", error);
                return { data: null, error };
            }

            return { data, error: null };
        } catch (error) {
            console.error("Error fetching store by ID:", error);
            return { data: null, error };
        }
    },

    getAddressesStore: async (storeId: string) => {
        try {
            const { data, error } = await supabase
                .from("address_store")
                .select("*")
                .eq("store_id", storeId);

            if (error) {
                console.error("Error fetching addresses for store:", error);
                return { data: null, error };
            }

            return { data, error: null };
        } catch (error) {
            console.error("Error fetching addresses for store:", error);
            return { data: null, error };
        }
    },

    getStoreSchedule: async (storeId: string) => {
        try {
            const { data, error } = await supabase
                .from("store_schedule")
                .select("*")
                .eq("store_id", storeId);

            if (error) {
                console.error("Error fetching store schedule:", error);
                return { data: null, error };
            }

            return { data, error: null };
        } catch (error) {
            console.error("Error fetching store schedule:", error);
            return { data: null, error };
        }
    },

    getStoreRatings: async (storeId: string) => {
        try {
            const { data, error } = await supabase
                .from("store_ratings")
                .select("*")
                .eq("store_id", storeId);

            if (error) {
                console.error("Error fetching store ratings:", error);
                return { data: null, error };
            }

            return { data, error: null };
        } catch (error) {
            console.error("Error fetching store ratings:", error);
            return { data: null, error };
        }
    },

    getStoreRatingsAverage: async (storeId: string) => {
        try {
            const { data, error } = await supabase
                .from("store_ratings")
                .select("rating")
                .eq("store_id", storeId);

            if (error) {
                console.error("Error fetching store ratings:", error);
                return { data: null, error };
            }

            if (!data || data.length === 0) {
                return { data: { average: 0, count: 0 }, error: null };
            }

            const validRatings = data
                .map((entry) => Number(entry?.rating))
                .filter((value) => Number.isFinite(value));

            if (!validRatings.length) {
                return { data: { average: 0, count: 0 }, error: null };
            }

            const sum = validRatings.reduce((acc, value) => acc + value, 0);
            const average = sum / validRatings.length;

            return { data: { average, count: validRatings.length }, error: null };
        } catch (error) {
            console.error("Error calculating store ratings average:", error);
            return { data: null, error };
        }
    },

};

export default storeService;
