import { supabase } from "@/lib/supabase";
import { Alert } from "react-native";

interface SignInAttributes {
  email: string;
  password: string;
}

interface SignUpAttributes {
  name: string;
  phone: string;
  email: string;
  password: string;
  cpf: string;
  date_birth: string;
}

const authService = {
  signIn: async (input: SignInAttributes) => {
    const { data, error } = await supabase.auth.signInWithPassword(input);
    if (error) {
      console.log(error);
      Alert.alert("Error", "Something went wrong.");
    }

    return data;
  },

  signUp: async (input: SignUpAttributes) => {

    const [day, month, year] = input.date_birth.split("/").map(Number);
    const date_birth = new Date(year, month - 1, day).toISOString().split("T")[0];
    const phone = input.phone.replace(/\D/g, "");
    
    if (!phone || !date_birth) {
      Alert.alert("Error", "Telefone ou data de nascimento inválidos");
      return;
    }
    
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          name: input.name,
          phone: phone,
          cpf: input.cpf,
          date_birth: date_birth,
        },
      },
    });

    if (error) {
      console.log(error);
      Alert.alert("Error", "Something went wrong.");
    }

    return data;
  },
};

export default authService;
