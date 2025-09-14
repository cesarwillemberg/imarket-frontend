import { supabase } from "@/lib/supabase";
import authService from "@/services/auth-service";
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
}

const SessionContext = createContext<SessionContextProps>({
  session: null,
  user: null,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export const SessionProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) {
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
    router.replace("/");
    setSession(null);
  };

  return (
    <SessionContext.Provider
      value={{
        session,
        user,
        isLoading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
