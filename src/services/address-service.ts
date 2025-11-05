import { supabase } from "../lib/supabase";

export interface inputAddressProps {
    address_id?: string;
    user_id?: string;
    is_default?: boolean;
    country?: string;
    state?: string;
    state_acronym?: string;
    city?: string;
    neighborhood?: string;
    street?: string;
    street_number?: string;
    address_type?: string;
    reference?: string;
    complement?: string;
    postal_code?: string;
    created_at?: string;
    updated_at?: string;
}

const sanitizePayload = (payload: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));

const addressService = {
    getAddresses: async (input: { user_id: string }) => {
        try {
            const { data, error } = await supabase
                .from("address")
                .select("*")
                .eq("user_id", input.user_id);

            if (error) {
                console.error("Error fetching addresses:", error);
                return { data: null, error };
            }

            return { data, error: null };
        } catch (caughtError) {
            console.error("Unexpected error fetching addresses:", caughtError);
            return { data: null, error: caughtError };
        }
    },

    postAddress: async (inputAddress: inputAddressProps) => {
        try {
            const payload = sanitizePayload(inputAddress);

            const { data, error } = await supabase
                .from("address")
                .insert([payload])
                .select()
                .single();

            if (error) {
                console.error("Error saving address:", error);
                return { data: null, error };
            }

            return { data, error: null };
        } catch (caughtError) {
            console.error("Unexpected error saving address:", caughtError);
            return { data: null, error: caughtError };
        }
    },

    updateAddress: async (inputAddress: inputAddressProps) => {
        try {
            const { address_id, ...rest } = inputAddress;

            if (!address_id) {
                throw new Error("Address id is required for update.");
            }

            const payload = sanitizePayload(rest);

            const { data, error } = await supabase
                .from("address")
                .update(payload)
                .eq("address_id", address_id)
                .select()
                .single();

            if (error) {
                console.error("Error updating address:", error);
                return { data: null, error };
            }

            return { data, error: null };
        } catch (caughtError) {
            console.error("Unexpected error updating address:", caughtError);
            return { data: null, error: caughtError };
        }
    },

    deleteAddress: async (input: { address_id: string; user_id: string; }) => {
        try {
            const { data, error } = await supabase
                .from("address")
                .delete()
                .eq("address_id", input.address_id)
                .eq("user_id", input.user_id)
                .select()
                .single();
            if (error) {
                console.error("Error deleting address:", error);
                return { data: null, error };
            }

            return { data, error: null };
        } catch (caughtError) {
            console.error("Unexpected error deleting address:", caughtError);
            return { data: null, error: caughtError };
        }
    },

    changeDefaultAddress: async (input: { user_id: string; address_id: string; }) => {
        try {
            // 1️⃣ Desmarca qualquer default existente
            const { error: unsetError } = await supabase
            .from("address")
            .update({ is_default: false })
            .eq("user_id", input.user_id)
            .eq("is_default", true);

            if (unsetError) {
            console.error("Erro ao desmarcar endereço padrão:", unsetError);
            return { data: null, error: unsetError };
            }

            // 2️⃣ Define o novo endereço padrão
            const { data, error } = await supabase
            .from("address")
            .update({ is_default: true })
            .eq("user_id", input.user_id)
            .eq("address_id", input.address_id)
            .select()
            .single();

            if (error) {
            console.error("Erro ao definir novo endereço padrão:", error);
            return { data: null, error };
            }

            return { data, error: null };
        } catch (caughtError) {
            console.error("Erro inesperado:", caughtError);
            return { data: null, error: caughtError };
        }
    },

    checkDuplicity: async (inputAddress: inputAddressProps) => {
        try {
            const { data, error } = await supabase
                .from("address")
                .select("*")
                .eq("user_id", inputAddress.user_id)
                .eq("country", inputAddress.country)
                .eq("state", inputAddress.state)
                .eq("state_acronym", inputAddress.state_acronym)
                .eq("city", inputAddress.city)
                .eq("neighborhood", inputAddress.neighborhood)
                .eq("street", inputAddress.street)
                .eq("street_number", inputAddress.street_number)
                .eq("postal_code", inputAddress.postal_code)
                .eq("complement", inputAddress.complement)
                .eq("reference", inputAddress.reference)
                .eq("address_type", inputAddress.address_type);

            if (error) {
                console.error("Error checking address duplicity:", error);
                return { data: null, error };
            }

            return { data, error: null };
        } catch (caughtError) {
            console.error("Unexpected error checking address duplicity:", caughtError);
            return { data: null, error: caughtError };
        }
    }
};

export default addressService;
