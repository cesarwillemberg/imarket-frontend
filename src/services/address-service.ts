import { Alert } from "react-native";
import { supabase } from "../lib/supabase";

interface inputAddressProps {
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
    }
}

export default addressService;