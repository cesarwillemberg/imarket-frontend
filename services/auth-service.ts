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

interface getInfoUserAttributes {
  id: string;
}

export interface UserInfo {
  id?: string;
  profile_picture?: string;
  profile_picture_base64?: string;
  nome?: string;
  cpf?: string;
  data_nascimento?: string;
  email?: string;
  telefone?: string | number;
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
    try {
      const [day, month, year] = input.date_birth.split("/").map(Number);
      const date_birth = new Date(year, month - 1, day).toISOString().split("T")[0];
      const phone = input.phone.replace(/\D/g, "");

      if (!phone || !date_birth) {
        Alert.alert("Error", "Telefone ou data de nascimento inválidos");
        return { data: null, error: new Error("Telefone ou data inválidos") };
      }

      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            name: input.name,
            email: input.email,
            phone: phone,
            cpf: input.cpf,
            date_birth: date_birth,
          },
        },
      });
      
      if (error) {
        console.log(error);
        Alert.alert("Error", "Algo deu errado no cadastro.");
        return;
      }

      return data;

    } catch (err: any) {
      console.error("signUp exception:", err);
      Alert.alert("Erro inesperado", err.message || "Something went wrong");
      return { data: null, error: err };
    }
  },

  getInfoUser: async (input: getInfoUserAttributes): Promise<UserInfo> => {
    const { data, error } = await supabase
      .from("perfis")
      .select("*")
      .eq("id", input.id)
      .single();

    if (error) {
      console.log(error);
      Alert.alert("Error", "Something went wrong.");
    }

    return data;
  },

  updateProfile: async (input: UserInfo) => {
    const { 
      id, 
      profile_picture, 
      profile_picture_base64,
      cpf, 
      data_nascimento, 
      email, 
      nome, 
      telefone,
    } = input
    const path = `profile_picture/${id}/avatar.jpg`;

    if (profile_picture?.startsWith('file://')) {
      try {
        // const response = await fetch(profile_picture); 
        // const arrayBuffer = await response.arrayBuffer();
        // console.log(response);
        // const base64 = await FileSystem.readAsStringAsync(profile_picture, { encoding: 'base64' });
        
        const { data, error } = await supabase.storage.from('profile_picture').upload(
          path, 
          profile_picture_base64, 
          { contentType: "image/jpeg", upsert: true, type: "base64" }
        );
        
        const { data: { publicUrl } } = await supabase.storage.from('profile_picture').getPublicUrl(path);    
      
        const { data: dataUpdate, error: ErrorUpdate } = await supabase
          .from('perfis')
          .update({
            cpf,
            telefone,
            nome,
            data_nascimento,
            email,
            profile_picture: publicUrl,
          })
          .eq("id", id);

        // const { data, error } = await supabase.auth.updateUser({ email: email});
        // console.log(data);
      } catch (error) {
        console.error("Erro no upload:", error);
      }
    } else if (profile_picture?.startsWith('http')) {
      try {
        
      } catch (error) {
        console.error("Erro no upload:", error);
      }
    }

    // const createPath = await supabase.storage.from('')
    
    // const { data, error } = await supabase.storage.from('profile_picture').cr
  }

};

export default authService;
