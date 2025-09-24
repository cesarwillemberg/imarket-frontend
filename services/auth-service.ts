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

interface RemoveProfilePictureProps {
  storageFilePath: string;
}

interface UploadProfilePictureProps {
  localFilePath: string;
  storageFilePath: string;
}

interface UpdateProfileProps {
  userInfo: UserInfo;
  profilePictureUrl: string
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
        throw error;
      }

      return { session: data.session, user: data.user };

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

  updateProfile: async (input: UpdateProfileProps) => {
    const { id, cpf, data_nascimento, email, nome, telefone,  } = input.userInfo;
    try {
      const { data: dataUpdate, error: errorUpdate } = await supabase
        .from('perfis')
        .update({
          cpf,
          telefone,
          nome,
          data_nascimento,
          email,
          profile_picture: input.profilePictureUrl,
        })
        .eq("id", id)
        .select()
        .throwOnError();

        return { dataUpdate, errorUpdate }
        
    } catch (error) {
      console.error("Erro no update:", error);
      throw error;
    }
  },

  UploadProfilePicture: async (input: UploadProfilePictureProps) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(
        input.localFilePath, 
        { encoding: FileSystem.EncodingType.Base64 }
      );
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from("profile_picture")
        .upload(input.storageFilePath, decode(base64), {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = await supabase
        .storage
        .from('profile_picture')
        .getPublicUrl(input.storageFilePath);

      return publicUrl
    } catch (error) {
      console.error("Erro ao salver arquivo no storage:", error);
      throw error;
    }
  },

  RemoveProfilePicture: async (input: RemoveProfilePictureProps) => {
    try {
      const { data, error } =  await supabase
        .storage
        .from('profile_picture')
        .remove([input.storageFilePath]);
        if (error) throw error
        return true
    } catch (error) {
      console.error("Erro ao exluir arquivo do storage:", error);
      throw error
    }
  },


};

export default authService;
