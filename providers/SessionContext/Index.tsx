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
    profile_picture_base64?: string;
    name?: string;
    cpf?: string;
    date_birth?: string;
    phone?: string;
    email?: string;
  }) => Promise<void>;
}

const SessionContext = createContext<SessionContextProps>({
  session: null,
  user: null,
  isLoading: true,
  isFirstAccess: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  getInfoUser: async () => {},
  updateProfile: async () => {},

  
});

export const SessionProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isFirstAccess, SetIsFirstAccess] = useState<boolean | null>(null);
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
    const { session, user } = await authService.signUp(input);
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
    profile_picture: string;
    profile_picture_base64?: string;
    name: string;
    phone: string;
    email: string;
    password: string;
    cpf: string;
    date_birth: string;
  }) => {
    const data = await authService.updateProfile(input);
    return data;
  }

  return (
    <SessionContext.Provider
      value={{
        session,
        user,
        isLoading,
        isFirstAccess,
        signIn,
        signUp,
        signOut,
        getInfoUser,
        updateProfile
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
