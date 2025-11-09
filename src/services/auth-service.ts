import { supabase } from "@/src/lib/supabase";
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
// import { File } from 'expo-file-system';
const sanitizeDigits = (value: string) => value.replace(/\D/g, "");

const formatCpfMask = (digits: string) => {
  if (digits.length !== 11) {
    return digits;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

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
    const normalizedCpf = sanitizeDigits(cpf);
    const maskedCpf = formatCpfMask(normalizedCpf);

    const uniqueCpfValues = [normalizedCpf, maskedCpf]
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index);

    const [emailResult, cpfResult] = await Promise.all([
      supabase
        .from("perfis")
        .select("id")
        .ilike("email", normalizedEmail)
        .limit(1),
      uniqueCpfValues.length
        ? supabase
            .from("perfis")
            .select("id")
            .in("cpf", uniqueCpfValues)
            .limit(1)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (emailResult.error || cpfResult.error) {
      throw emailResult.error ?? cpfResult.error;
    }

    return {
      emailExists: (emailResult.data?.length ?? 0) > 0,
      cpfExists: (cpfResult.data?.length ?? 0) > 0,
    };
  },

  signUp: async (input: SignUpAttributes) => {
    try {
      const [day, month, year] = input.date_birth.split("/").map(Number);
      const parsedDate = new Date(year, month - 1, day);
      const date_birth = parsedDate.toISOString().split("T")[0];
      const phone = sanitizeDigits(input.phone);
      const sanitizedCpf = sanitizeDigits(input.cpf);

      if (!phone || Number.isNaN(parsedDate.getTime()) || !sanitizedCpf) {
        const validationError = new Error("Invalid phone number, CPF or date of birth.");
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
            cpf: sanitizedCpf,
            date_birth,
          },
        },
      });
      
      if (error) {
        console.error("Error during sign up:", error);
        return { data: null, error };
      }

      const identities = data?.user?.identities;
      if (Array.isArray(identities) && identities.length === 0) {
        const duplicateEmailError = new Error("Email já está cadastrado.");
        return { data: null, error: duplicateEmailError };
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
