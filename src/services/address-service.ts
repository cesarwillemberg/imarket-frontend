import { Alert } from "react-native";
import { supabase } from "../lib/supabase";

export interface inputAddressProps {
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
}

const addressService = {
    getAddresses: async (input: { user_id: string }) => {
        try {
            const { data, error } = await supabase
                .from('address')
                .select('*')
                .eq('user_id', input.user_id);

            if (error) {
                console.error('Erro ao buscar endereços:', error);
                Alert.alert("Erro", "Falha ao buscar endereços. Tente novamente.");
                return { data, error };
            }

            return { data, error };
        } catch (error) {
            console.error('Erro inesperado ao buscar endereços:', error);
            Alert.alert("Erro", "Falha ao buscar endereços. Tente novamente.");
            return { data: null, error };
        }
    },
    postAddress: async (inputAddress: inputAddressProps) => {
        try {
            const { data, error } = await supabase
                .from('address')
                .insert([inputAddress])
                .select()
                .single();

            if (error) {
                console.error('Erro ao salvar endereço:', error);
                Alert.alert("Erro", "Falha ao salvar o endereço. Tente novamente.");
                return;
            }

            Alert.alert("Sucesso", "Endereço salvo com sucesso!");
            return { data, error };
        } catch (error) {
            console.error('Erro inesperado ao salvar endereço:', error);
            Alert.alert("Erro", "Falha ao salvar o endereço. Tente novamente.");
            return { data: null, error };
        }
    },

    updateAddress: async (inputAddress: inputAddressProps) => {
        try {
            const { data, error } = await supabase
                .from('address')
                .update(inputAddress)
                .eq('id', inputAddress.user_id)
                .select()
                .single();

            if (error) {
                console.error('Erro ao atualizar endereço:', error);
                Alert.alert("Erro", "Falha ao atualizar o endereço. Tente novamente.");
                return;
            }

            Alert.alert("Sucesso", "Endereço atualizado com sucesso!");
            return { data, error };
        } catch (error) {
            console.error('Erro inesperado ao atualizar endereço:', error);
            Alert.alert("Erro", "Falha ao atualizar o endereço. Tente novamente.");
            return { data: null, error };
        }
    },

    deleteAddress: async (address_id: string) => {
        try {
            const { data, error } = await supabase
                .from('address')
                .delete()
                .eq('id', address_id)
                .select()
                .single();
            
            if (error) {
                console.error('Erro ao deletar endereço:', error);
                Alert.alert("Erro", "Falha ao deletar o endereço. Tente novamente.");
                return;
            }
            Alert.alert("Sucesso", "Endereço deletado com sucesso!");
            return { data, error };
        } catch (error) {
            console.error('Erro inesperado ao deletar endereço:', error);
            Alert.alert("Erro", "Falha ao deletar o endereço. Tente novamente.");
            return { data: null, error };
        }
    },

    changeDefaultAddress: async (user_id: string, address_id: string) => {
        try {
            
           
        } catch (error) {
            console.error('Erro inesperado ao deletar endereço:', error);
            Alert.alert("Erro", "Falha ao deletar o endereço. Tente novamente.");
            return { data: null, error };
        }
    },

    checkDuplicity: async (inputAddress: inputAddressProps) => {
        try {
            const { data, error } = await supabase
                .from('address')
                .select('*')
                .eq('user_id', inputAddress.user_id)
                .eq('country', inputAddress.country)
                .eq('state', inputAddress.state)
                .eq('state_acronym', inputAddress.state_acronym)
                .eq('city', inputAddress.city)
                .eq('neighborhood', inputAddress.neighborhood)
                .eq('street', inputAddress.street)
                .eq('street_number', inputAddress.street_number)
                .eq('postal_code', inputAddress.postal_code)
                .eq('complement', inputAddress.complement)
                .eq('reference', inputAddress.reference)
                .eq('address_type', inputAddress.address_type);

            if (error) {
                console.error('Erro ao verificar duplicidade de endereço:', error);
                Alert.alert("Erro", "Falha ao verificar duplicidade de endereço. Tente novamente.");
                return { data: null, error };
            }

            return { data, error };
        } catch (error) {
            console.error('Erro inesperado ao verificar duplicidade de endereço:', error);
            Alert.alert("Erro", "Falha ao verificar duplicidade de endereço. Tente novamente.");
            return { data: null, error };
        }
    }
}

export default addressService;