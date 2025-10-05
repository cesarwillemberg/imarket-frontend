import { supabase } from "@/src/lib/supabase";
import addressService from "@/src/services/address-service";
import authService, { UserInfo } from "@/src/services/auth-service";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Session, User } from "@supabase/supabase-js";
import { useRouter } from "expo-router";
import {
  createContext,
  FC,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface SessionContextProps {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isFirstAccess: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: {
    name: string;
    phone: string;
    email: string;
    password: string;
    cpf: string;
    date_birth: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  getInfoUser: (input: { id: string; }) => Promise<UserInfo>;
  updateProfile: (input: {
    id?: string; 
    profile_picture?: string;
    name?: string;
    cpf?: string;
    date_birth?: string;
    phone?: string;
    email?: string;
  }) => Promise<{ dataUpdate: any; errorUpdate: any }>;
  updateProfilePicture: (input: {   
    localFilePath: string;
    storageFilePath: string; 
  }) => Promise<string>;
  removeProfilePicture: (input: { storageFilePath: string; }) => Promise<boolean>;
  changeEmail: (newEmail: string) => Promise<{ data: any; message: string }>;
  postAddress: (inputAddress: {
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
  }) => Promise<{ data: any; error: any }>;
}

const SessionContext = createContext<SessionContextProps>({
  session: null,
  user: null,
  isLoading: true,
  isFirstAccess: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  getInfoUser: async (_input: { id: string }): Promise<UserInfo> => {
    throw new Error("getInfoUser not implemented.");
  },
  updateProfile: async (_input: {
    id?: string;
    profile_picture?: string;
    name?: string;
    cpf?: string;
    date_birth?: string;
    phone?: string;
    email?: string;
  }): Promise<{ dataUpdate: any; errorUpdate: any }> => {
    throw new Error("updateProfile not implemented.");
  },
  updateProfilePicture: async (_input: { localFilePath: string; storageFilePath: string }): Promise<string> => {
    throw new Error("updateProfilePicture not implemented.");
  },
  removeProfilePicture: async (_input: { storageFilePath: string }): Promise<boolean> => {
    throw new Error("removeProfilePicture not implemented.");
  },
  changeEmail: async (_newEmail: string): Promise<{ data: any; message: string }> => {
    throw new Error("changeEmail not implemented.");
  },
  postAddress: async (inputAddress: {
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
  }): Promise<{ data: any; error: any }> => {
    throw new Error("PostAddress not implemented.");
  }
});

export const SessionProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isFirstAccess, SetIsFirstAccess] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const value = await AsyncStorage.getItem("isFirstAccess")

      if (mounted) {
        if (value === null) {
          SetIsFirstAccess(true);
        } else {
          SetIsFirstAccess(value === "true");
        }
        setSession(data.session);
        setIsLoading(false);
      }
    };
    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, _session) => {
        if (mounted) {
          setSession(_session);
          
          // TEMPORARIAMENTE DESABILITADO - Detectar quando email foi confirmado e sincronizar com tabela perfis
          // if (event === 'USER_UPDATED' && _session?.user) {
          //   const newEmail = _session.user.email;
          //   const userId = _session.user.id;
            
          //   if (newEmail) {
          //     try {
          //       console.log("🔄 Email confirmado, sincronizando com tabela perfis...");
          //       await authService.syncEmailToPerfis(userId, newEmail);
          //       console.log("✅ Email sincronizado com sucesso na tabela perfis");
          //     } catch (error) {
          //       console.error("❌ Erro ao sincronizar email na tabela perfis:", error);
          //     }
          //   }
          // }
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe;
    };
  }, []);

  const user = session?.user ?? null;

  const signIn = async (email: string, password: string) => {
    const { session, user } = await authService.signIn({ email, password });
    setSession(session);
  };

  const signUp = async (input: {
    name: string;
    phone: string;
    email: string;
    password: string;
    cpf: string;
    date_birth: string;
  }) => {
    const { data, error } = await authService.signUp(input);
    if (error) {
      throw error;
    }
    if (!data) {
      throw new Error("No data returned from signUp.");
    }

    const { session, user } = data;
    setSession(session);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    // router.dismissAll();
    // router.replace("/");
    router.replace("/signin");
    setSession(null);
  };

  const getInfoUser = async (input: { id: string }): Promise<UserInfo> => {
    const data = await authService.getInfoUser(input);
    return data;
  }

  const updateProfile = async (input: {
    id?: string;
    profile_picture?: string;
    name?: string;
    cpf?: string;
    date_birth?: string;
    phone?: string;
    email?: string;
  }) => {
    try {
      const { dataUpdate, errorUpdate } = await authService.updateProfile({ 
        userInfo: input, 
        profilePictureUrl: input.profile_picture || "" 
      });
      
      return { dataUpdate, errorUpdate };
    } catch (error) {
      console.error("❌ SessionContext: Erro ao atualizar perfil:", error);
      return { dataUpdate: null, errorUpdate: error };
    }
  }

  const updateProfilePicture = async (input: { localFilePath: string; storageFilePath: string }) => {
    const publicUrl = await authService.UploadProfilePicture(input);
    return publicUrl;
  };

  const removeProfilePicture = async (input: { storageFilePath: string }) => {
    const success = await authService.RemoveProfilePicture(input);
    return success;
  };

  const changeEmail = async (newEmail: string) => {
    try {
      const result = await authService.changeEmail({ newEmail });
      return result;
    } catch (error) {
      console.error("❌ SessionContext: Erro ao alterar email:", error);
      throw error;
    }
  };

  const postAddress = async (inputAddress: {
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
  }) => {
    try {
      const result = await addressService.postAddress(inputAddress);
      if (!result) {
        return { data: null, error: "Unknown error" };
      }
      return result;
    } catch (error) {
      console.error("❌ SessionContext: Erro ao cadastrar endereço:", error);
      throw error;
    }
  }

  return (
    <SessionContext.Provider
      value={{
        session,
        user,
        isLoading,
        isFirstAccess: isFirstAccess,
        signIn,
        signUp,
        signOut,
        getInfoUser,
        updateProfile,
        updateProfilePicture,
        removeProfilePicture,
        changeEmail,
        postAddress,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
