import { supabase } from "@/lib/supabase";
import authService, { UserInfo } from "@/services/auth-service";
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
    throw new Error("getInfoUser not implemented");
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
    throw new Error("updateProfile not implemented");
  },
  updateProfilePicture: async (_input: { localFilePath: string; storageFilePath: string }): Promise<string> => {
    throw new Error("updateProfilePicture not implemented");
  },
  removeProfilePicture: async (_input: { storageFilePath: string }): Promise<boolean> => {
    throw new Error("removeProfilePicture not implemented");
  },


  
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
      (_event, _session) => {
        if (mounted) setSession(_session);
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
      throw new Error("No data returned from signUp");
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
    const { dataUpdate, errorUpdate } = await authService.updateProfile({ 
      userInfo: input, 
      profilePictureUrl: input.profile_picture || "" 
    });
    return { dataUpdate, errorUpdate };
  }

  const updateProfilePicture = async (input: { localFilePath: string; storageFilePath: string }) => {
    const publicUrl = await authService.UploadProfilePicture(input);
    return publicUrl;
  };

  const removeProfilePicture = async (input: { storageFilePath: string }) => {
    const success = await authService.RemoveProfilePicture(input);
    return success;
  };

  return (
    <SessionContext.Provider
      value={{
        session,
        user,
        isLoading,
        isFirstAccess: isFirstAccess ?? false,
        signIn,
        signUp,
        signOut,
        getInfoUser,
        updateProfile,
        updateProfilePicture,
        removeProfilePicture,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
