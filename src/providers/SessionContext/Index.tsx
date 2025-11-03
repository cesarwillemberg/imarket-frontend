import { supabase } from "@/src/lib/supabase";
import addressService from "@/src/services/address-service";
import authService, { UserInfo } from "@/src/services/auth-service";
import cartService from "@/src/services/cart-service";
import productService from "@/src/services/products-service";
import storeService from "@/src/services/store-service";
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
  getAddresses: (input: { user_id: string }) => Promise<{ data: any; error: any }>;
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
    complement?: string;
    reference?: string;
    postal_code?: string;
  }) => Promise<{ data: any; error: any }>;
  updateAddress: (inputAddress: {
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
    complement?: string;
    reference?: string;
    postal_code?: string;
  }) => Promise<{ data: any; error: any }>;
  deleteAddress: (input: { address_id: string; user_id: string; }) => Promise<{ data: any; error: any }>;
  changeDefaultAddress: (input: { address_id: string; user_id: string; }) => Promise<{ data: any; error: any }>;
  checkDuplicity: (inputAddress: {
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
  getStores: () => Promise<{ data: any; error: any }>;
  getStoreById: (storeId: string) => Promise<{ data: any; error: any }>;
  getStoreRatings: (storeId: string) => Promise<{ data: any; error: any }>;
  getStoreRatingsAverage: (storeId: string) => Promise<{ data: any; error: any }>;
  getAddressesStore: (storeId: string) => Promise<{ data: any; error: any }>;
  getStoreSchedule: (storeId: string) => Promise<{ data: any; error: any }>;
  getProductsByStoreId: (storeId: string) => Promise<{ data: any; error: any }>;
  getImageProduct: (productId: string) => Promise<{ data: any; error: any }>;
  getItemPromotionByStore: (storeId: string) => Promise<{ data: any; error: any }>;
  getCartByUserId: (userId: string) => Promise<{ data: any; error: any }>;
  addItemToCart: (inputProduct: {
    userId: string;
    cart_id: string;
    store_id: string;
    produto_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }) => Promise<{ data: any; error: any }>;
  removeItemFromCart: (userId: string, productId: string) => Promise<{ data: any; error: any }>;
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
  getAddresses: async (input: { user_id: string }): Promise<{ data: any; error: any }> => {
    throw new Error("getAddresses not implemented.");
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
  },
  updateAddress: async (inputAddress: {
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
  },
  deleteAddress: async (input: { address_id: string; user_id: string; }): Promise<{ data: any; error: any }> => {
    throw new Error("deleteAddress not implemented.");
  },
  changeDefaultAddress: async (input: { address_id: string; user_id: string; }): Promise<{ data: any; error: any }> => {
    throw new Error("changeDefaultAddress not implemented.");
  },
  checkDuplicity: async (inputAddress: {
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
  },
  getStores: async (): Promise<{ data: any; error: any }> => {
    throw new Error("getStores not implemented.");
  },
  getStoreById: async (_storeId: string): Promise<{ data: any; error: any }> => {
    throw new Error("getStoreById not implemented."); 
  },
  getStoreRatings: async (_storeId: string): Promise<{ data: any; error: any }> => {
    throw new Error("getStoreRatings not implemented.");
  },
  getStoreRatingsAverage: async (_storeId: string): Promise<{ data: any; error: any }> => {
    throw new Error("getStoreRatingsAverage not implemented.");
  },
  getAddressesStore: async (storeId: string) => {
    throw new Error("getAddressesStore not implemented.");
  },
  getStoreSchedule: async (storeId: string) => {
    throw new Error("getStoreSchedule not implemented.");
  },
  getProductsByStoreId: async (storeId: string) => {
    throw new Error("getProductsByStoreId not implemented.");
  },
  getImageProduct: async (_productId: string) => {
    throw new Error("getImageProduct not implemented.");
  },
  getItemPromotionByStore: async (_storeId: string) => {
    throw new Error("getItemPromotionByStore not implemented.");
  },
  getCartByUserId: async (_userId: string) => {
    throw new Error("getCartByUserId not implemented.");
  },
  addItemToCart: (inputProduct: {
    userId: string;
    cart_id: string;
    store_id: string;
    produto_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }) => {
    throw new Error("addItemToCart not implemented.");
  },
  removeItemFromCart: async (_userId: string, _productId: string) => {
    throw new Error("removeItemFromCart not implemented.");
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

  const getAddresses = async (input: { user_id: string }): Promise<{ data: any; error: any }> => {
    try {
      const { data, error } = await addressService.getAddresses(input);
      return { data, error };
    } catch (error) {
      console.error("❌ SessionContext: Erro ao buscar endereços:", error);
      return { data: null, error };
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
      console.log(result);
      
      if (!result) {
        return { data: null, error: "Unknown error" };
      }
      return result;
    } catch (error) {
      console.error("❌ SessionContext: Erro ao cadastrar endereço:", error);
      throw error;
    }
  }

  const updateAddress = async (inputAddress: {
    id_address?: string;
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
  }) => {
    try {
      const result = await addressService.updateAddress(inputAddress);
      return result;
    } catch (error) {
      console.error("❌ SessionContext: Erro ao atualizar endereço:", error);
      throw error;
    }
  }

  const deleteAddress = async (input: { address_id: string; user_id: string; }) => {
    try {
      const result = await addressService.deleteAddress(input);
      return result;
    } catch (error) {
      console.error("❌ SessionContext: Erro ao deletar endereço:", error);
      throw error;
    }
  }

  const changeDefaultAddress = async (input: { address_id: string; user_id: string; }) => {
    try {
      const result = await addressService.changeDefaultAddress(input);
      return result;
    } catch (error) {
      console.error("❌ SessionContext: Erro ao mudar endereço padrão:", error);
      throw error;
    }
  }

  const checkDuplicity = async (inputAddress: {
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
      const result = await addressService.checkDuplicity(inputAddress);
      return result;
    } catch (error) {
      console.error("❌ SessionContext: Erro ao verificar duplicidade de endereço:", error);
      throw error;
    }
  }

  const getStores = async (): Promise<{ data: any; error: any }> => {
    try {
      const { data, error } = await storeService.getStores();
      return { data, error };
    } catch (error) {
      console.error("❌ SessionContext: Erro ao buscar lojas:", error);
      return { data: null, error };
    }
  };

  const getStoreRatings = async (storeId: string): Promise<{ data: any; error: any }> => {
    try {
      const { data, error } = await storeService.getStoreRatings(storeId);
      return { data, error };
    } catch (error) {
      console.error("❌ SessionContext: Erro ao buscar avaliações da loja:", error);
      return { data: null, error };
    }
  }

  const getStoreRatingsAverage = async (storeId: string): Promise<{ data: any; error: any }> => {
    try {
      const { data, error } = await storeService.getStoreRatingsAverage(storeId);
      return { data, error };
    } catch (error) {
      console.error("❌ SessionContext: Erro ao buscar avaliações da loja:", error);
      return { data: null, error };
    }
  };

  const getAddressesStore = async (storeId: string): Promise<{ data: any; error: any }> => {
    try {
      const { data, error } = await storeService.getAddressesStore(storeId);
      return { data, error };
    } catch (error) {
      console.error("❌ SessionContext: Erro ao buscar endereços da loja:", error);
      return { data: null, error };
    }
  }

  const getStoreById = async (storeId: string): Promise<{ data: any; error: any }> => {
    try {
      const { data, error } = await storeService.getStoreById(storeId);
      return { data, error };
    } catch (error) {
      console.error("❌ SessionContext: Erro ao buscar loja:", error);
      return { data: null, error };
    }
  }

  const getStoreSchedule = async (storeId: string): Promise<{ data: any; error: any }> => {
    try {
      const { data, error } = await storeService.getStoreSchedule(storeId);
      return { data, error };
    } catch (error) {
      console.error("❌ SessionContext: Erro ao buscar horário da loja:", error);
      return { data: null, error };
    }
  }

  const getProductsByStoreId = async (storeId: string): Promise<{ data: any; error: any }> => {
    try {
      const { data, error } = await productService.getProductsByStoreId(storeId);
      return { data, error };
    } catch (error) {
      console.error("SessionContext: Erro ao buscar produtos da loja:", error);
      return { data: null, error };
    }
  }

  const getImageProduct = async (productId: string): Promise<{ data: any; error: any }> => {
    try {
      const { data, error } = await productService.getImageProduct(productId);
      return { data, error };
    } catch (error) {
      console.error("SessionContext: Erro ao buscar imagem do produto:", error);
      return { data: null, error };
    }
  }

  const getItemPromotionByStore = async (storeId: string): Promise<{ data: any; error: any }> => {
    try {
      const { data, error } = await productService.getItemPromotionByStore(storeId);
      return { data, error };
    } catch (error) {
      console.error("SessionContext: Erro ao buscar promocoes da loja:", error);
      return { data: null, error };
    }
  }

  const getCartByUserId = async (userId: string): Promise<{ data: any; error: any }> => {
    try {
      const { data, error } = await cartService.getCartByUserId(userId);
      return { data, error };
    } catch (error) {
      console.error("SessionContext: Erro ao buscar carrinho do usuário:", error);
      return { data: null, error };
    }
  }

  const addItemToCart = async (inputProduct: {
    userId: string;
    cart_id: string;
    store_id: string;
    produto_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }): Promise<{ data: any; error: any }> => {
    try {
      const { data, error } = await cartService.addItemToCart(inputProduct);
      return { data, error };
    } catch (error) {
      console.error("SessionContext: Erro ao adicionar item ao carrinho:", error);
      return { data: null, error };
    }
  };

  const removeItemFromCart = async (userId: string, productId: string): Promise<{ data: any; error: any }> => {
    try {
      const { data, error } = await cartService.removeItemFromCart(userId, productId);
      return { data, error };
    } catch (error) {
      console.error("SessionContext: Erro ao remover item do carrinho:", error);
      return { data: null, error };
    }
  };

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
        getAddresses,
        postAddress,
        updateAddress,
        deleteAddress,
        changeDefaultAddress,
        checkDuplicity,
        getStores,
        getStoreRatings,
        getStoreRatingsAverage,
        getAddressesStore,
        getStoreById,
        getStoreSchedule,
        getProductsByStoreId,
        getImageProduct,
        getItemPromotionByStore,
        getCartByUserId,
        addItemToCart,
        removeItemFromCart,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
