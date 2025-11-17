import EditProfileForm from "@/src/components/auth/EditProfileForm";
import HeaderScreen from "@/src/components/common/HeaderScreen";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { useSession } from "@/src/providers/SessionContext/Index";
import { UserInfo } from "@/src/services/auth-service";
import { useTheme } from "@/src/themes/ThemeContext";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useEffect, useRef, useState } from "react";
import { findNodeHandle, ScrollView, TextInput, View } from "react-native";
import createStyles from "./styled";

export default function EditProfile() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const { user, getInfoUser } = useSession();
  const animationLoading = useRef<LottieView>(null);

  const [userData, setUserData] = useState<UserInfo>();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const inputNameRef = useRef<TextInput>(null);
  const inputCPFRf = useRef<TextInput>(null);
  const inputDateOfBirthRef = useRef<TextInput>(null);

  const handleGetInfoUser = async () => {
    if (!user || !user.id) {
      console.warn("Usuário não disponível ou ID indefinido.");
      return;
    }

    try {
      const data = await getInfoUser({id: user.id});
      setUserData(data);
      
    } catch (error) {
      console.error("Erro ao buscar informações do usuário:", error);
    }
  }

  const fetchData = async () => {
    setIsLoading(true);
    await handleGetInfoUser();
    setIsLoading(false);
  };

  useEffect(()=>{
    fetchData();
  },[])

  const onRefresh = async () => {
    setRefreshing(true);
    await handleGetInfoUser();
    setRefreshing(false);
  };

  const scrollToInput = (inputRef: React.RefObject<TextInput>) => {
    if (!inputRef.current || !scrollViewRef.current) return;

    const inputHandle = findNodeHandle(inputRef.current);
    if (!inputHandle) return;

    scrollViewRef.current.scrollResponderScrollNativeHandleToKeyboard(
      inputHandle,
      20,
      true
    );
  };

  return (
    <ScreenContainer>
      <HeaderScreen title="Editar Perfil" showButtonBack />
      <View style={styles.container}>
        <ScrollView
          // contentContainerStyle={[styles.container, isLoading ? { justifyContent: "center" } : {}]}
          // refreshControl={
          //   <RefreshControl   
          //     refreshing={refreshing}
          //     onRefresh={onRefresh}
          //     title="Carregando..."
          //     colors={['#ff0000', '#00ff00', '#0000ff']}
          //     tintColor="#ff0000"
          //     titleColor="#00ff00" 
          //   />
          // }
        >
          {/* {isLoading ? (
              <LoadingIcon
                autoPlay
                loop
                source={loadingCart}
                refAnimationLoading={animationLoading}
                style={{ width: 150, height: 150 }}
              />
          ) : (
            <> */}
              <View>
                <EditProfileForm />
              </View>
            {/* </>
          )} */}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

