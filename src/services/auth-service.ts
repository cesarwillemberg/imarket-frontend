import { supabase } from "@/src/lib/supabase";
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
// import { File } from 'expo-file-system';
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

interface CheckUserExistsAttributes {
  email: string;
  cpf: string;
}

interface getInfoUserAttributes {
  id: string;
}

export interface UserInfo {
  id?: string;
  profile_picture?: string;
  nome?: string;
  name?: string;  // Adicionar para compatibilidade
  cpf?: string;
  data_nascimento?: string;
  date_birth?: string;  // Adicionar para compatibilidade
  email?: string;
  telefone?: string | number;
  phone?: string;  // Adicionar para compatibilidade
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

interface ChangeEmailProps {
  newEmail: string;
}

const authService = {
  signIn: async (input: SignInAttributes) => {
    const { data, error } = await supabase.auth.signInWithPassword(input);
    if (error) {
      console.error("Error signing in:", error);
      throw error;
    }
    return data;
  },

  checkExistingUser: async ({
    email,
    cpf,
  }: CheckUserExistsAttributes): Promise<{ emailExists: boolean; cpfExists: boolean; }> => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCpf = cpf.replace(/\D/g, "");

    const [
      { count: emailCount, error: emailError },
      { count: cpfCount, error: cpfError },
    ] = await Promise.all([
      supabase
        .from("perfis")
        .select("id", { count: "exact", head: true })
        .eq("email", normalizedEmail),
      supabase
        .from("perfis")
        .select("id", { count: "exact", head: true })
        .eq("cpf", normalizedCpf),
    ]);

    if (emailError || cpfError) {
      throw emailError ?? cpfError;
    }

    return {
      emailExists: (emailCount ?? 0) > 0,
      cpfExists: (cpfCount ?? 0) > 0,
    };
  },

  signUp: async (input: SignUpAttributes) => {
    try {
      const [day, month, year] = input.date_birth.split("/").map(Number);
      const parsedDate = new Date(year, month - 1, day);
      const date_birth = parsedDate.toISOString().split("T")[0];
      const phone = input.phone.replace(/\D/g, "");

      if (!phone || Number.isNaN(parsedDate.getTime())) {
        const validationError = new Error("Invalid phone number or date of birth.");
        return { data: null, error: validationError };
      }

      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            name: input.name,
            email: input.email,
            phone,
            cpf: input.cpf,
            date_birth,
          },
        },
      });
      
      if (error) {
        console.error("Error during sign up:", error);
        return { data: null, error };
      }

      return { 
        data: { session: data.session, user: data.user },
        error: null,
      };

    } catch (err) {
      console.error("signUp exception:", err);
      const caughtError = err instanceof Error ? err : new Error("Unexpected signUp error.");
      return { data: null, error: caughtError };
    }
  },

  getInfoUser: async (input: getInfoUserAttributes): Promise<UserInfo> => {
    const { data, error } = await supabase
      .from("perfis")
      .select("*")
      .eq("id", input.id)
      .single();

    if (error) {
      console.error("Error fetching user info:", error);
      throw error;
    }

    if (!data) {
      throw new Error("User profile not found.");
    }

    return data;
  },

  updateProfile: async (input: UpdateProfileProps) => {
    const userInfo = input.userInfo;
    
    // Mapear campos corretamente - EXCLUINDO email (deve ser alterado via changeEmail)
    const updateData = {
      cpf: userInfo.cpf,
      telefone: userInfo.telefone || userInfo.phone,
      nome: userInfo.nome || userInfo.name,
      data_nascimento: userInfo.data_nascimento || userInfo.date_birth,
      // email: NÃO incluir aqui - deve usar changeEmail()
      profile_picture: input.profilePictureUrl,
    };

    try {
      const { data: dataUpdate, error: errorUpdate } = await supabase
        .from('perfis')
        .update(updateData)
        .eq("id", userInfo.id)
        .select()
        .throwOnError();

      return { dataUpdate, errorUpdate };
        
    } catch (error: any) {
      console.error("❌ Erro na atualização do perfil:", error);
      throw error;
    }
  },

  changeEmail: async (input: ChangeEmailProps) => {
    try {
      console.log("📧 Alterando email para:", input.newEmail);
      
      // 1. Atualizar email no auth.users (envia verificação)
      const { data, error } = await supabase.auth.updateUser({
        email: input.newEmail
      });

      if (error) {
        console.error("❌ Erro ao alterar email:", error);
        throw error;
      }

      console.log("✅ Email alterado no auth.users. Verificação enviada para:", input.newEmail);
      console.log("📬 O usuário deve confirmar o novo email para completar a alteração.");
      
      return { 
        data, 
        message: `Email de verificação enviado para ${input.newEmail}. Verifique sua caixa de entrada e confirme para completar a alteração.` 
      };

    } catch (error: any) {
      console.error("❌ Erro na alteração de email:", error);
      throw error;
    }
  },

  // Nova função para sincronizar email na tabela perfis após confirmação
  syncEmailToPerfis: async (userId: string, newEmail: string) => {
    try {
      console.log("🔄 [syncEmailToPerfis] Iniciando sincronização:", { userId, newEmail });

      const { data, error } = await supabase
        .from('perfis')
        .update({ email: newEmail })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error("❌ [syncEmailToPerfis] Erro na query:", error);
        console.error("❌ [syncEmailToPerfis] Detalhes do erro:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log("✅ [syncEmailToPerfis] Email sincronizado com sucesso:", data);
      return data;

    } catch (error: any) {
      console.error("❌ [syncEmailToPerfis] Erro geral na sincronização:", error);
      console.error("❌ [syncEmailToPerfis] Stack trace:", error.stack);
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

      return publicUrl + `?t=${Date.now()}`;
    } catch (error) {
      console.error("Error saving file to storage:", error);
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
      console.error("Error deleting file from storage:", error);
      throw error
    }
  },


};

export default authService;
