import { supabase } from "@/lib/supabase";
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
// import { File } from 'expo-file-system';
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
      cpf, 
      data_nascimento, 
      email, 
      nome, 
      telefone,
    } = input;

    const path = `${id}/avatar.jpg`;
    let finalProfilePictureUrl = profile_picture; // começa com o valor original

    try {
      // Se for uma imagem local, faz upload para Supabase Storage
      if (profile_picture?.startsWith('file://')) {
        const base64 = await FileSystem.readAsStringAsync(
          profile_picture, 
          { encoding: FileSystem.EncodingType.Base64 }
        );

        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from("profile_picture")
          .upload(path, decode(base64), {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (uploadError) {
          console.error("Erro ao fazer upload:", uploadError);
          return;
        }

        const { data } = await supabase
          .storage
          .from('profile_picture')
          .getPublicUrl(path);

        finalProfilePictureUrl = data.publicUrl;
      }

      // Agora faz o update no perfil
       const { data: dataUpdate, error: errorUpdate } = await supabase
        .from('perfis')
        .update({
          cpf,
          telefone,
          nome,
          data_nascimento,
          email,
          profile_picture: finalProfilePictureUrl,
        })
        .eq("id", id)
        .select();

        console.log({dataUpdate, errorUpdate});
        
    } catch (error) {
      console.error("Erro no update:", error);
    }
  }


};

export default authService;
