import { useSession } from "@/providers/SessionContext/Index";
import ProfielPictureAndName from "@/src/components/auth/profile/ProfilePictureandName";
import { Button } from "@/src/components/common/Button";
import HeaderScreen from "@/src/components/common/HeaderScreen";
import ProfileButton from "@/src/components/common/ProfileButton";
import { ScreenContainer } from "@/src/components/common/ScreenContainer/Index";
import { useTheme } from "@/themes/ThemeContext";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useEffect, useRef, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import createStyles from "./stylde";

export default function Profile() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { signOut, user, getInfoUser } = useSession();
  const router = useRouter();

  const [name, setName] = useState<string>();
  const [profilePicture, setProfilePicture] = useState<string>();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const animationLoading = useRef<LottieView>(null);

  const handleGetInfoUser = async () => {
    if (!user) return null;    
    const data = await getInfoUser({id: user.id});
    setName(data?.nome)
    setProfilePicture(data?.profile_picture)
  }

  const fetchData = async () => {
    setIsLoading(true);
    animationLoading.current?.play();
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


  const handleSignOut = () => {
    signOut()
  }

  return (
    <ScreenContainer>
      <HeaderScreen title="Perfil" />
      <View style={{ flex: 1, paddingVertical: 20, paddingHorizontal: theme.spacing.lg}}>
        <ScrollView
          contentContainerStyle={[styles.container, isLoading || refreshing ? { justifyContent: "center", alignItems: "center" } : {}]}
          // scrollEnabled={false}
          refreshControl={
            <RefreshControl   
              refreshing={refreshing}
              onRefresh={onRefresh}
              title="Carregando..."
              colors={['#ff0000', '#00ff00', '#0000ff']}
              tintColor="#ff0000"
              titleColor="#00ff00" 
            />
          }
        >
          {
            isLoading || refreshing ? (
              <LottieView
                  source={require("@/src/assets/animations/loading/loading-cart.json")}
                  style={{ width: 150, height: 150 }}
                  loop={true}
                  autoPlay={true}
                  ref={animationLoading}
              />
            ) : (
              <>
                <View style={{marginVertical: 20}}>
                  <ProfielPictureAndName 
                    name={name} 
                    pathImage={profilePicture}
                  />
                </View>
                <View style={{
                  marginVertical: 5
                }}>
                  <ProfileButton
                    iconName="chat-processing-outline" 
                    iconType="MaterialCommunityIcons" 
                    title="Conversas"
                    linkPage="/(auth)/profile/chats"
                  />
                  <ProfileButton
                    iconName="bell-outline" 
                    iconType="MaterialCommunityIcons" 
                    title="Notificações"
                    linkPage="/(auth)/profile/notifications"
                  />
                  <ProfileButton
                    iconName="card-account-details-outline" 
                    iconType="MaterialCommunityIcons" 
                    title="Informações do Perfil"
                    linkPage="/(auth)/profile/viewprofile"
                  />
                  <ProfileButton
                    iconName="credit-card" 
                    iconType="fontawesome" 
                    title="Formas de Pagamento"
                    linkPage="/(auth)/profile/payments"
                  />
                  <ProfileButton
                    iconName="map-marker-outline" 
                    iconType="MaterialCommunityIcons" 
                    title="Meus Endereços"
                    linkPage="/(auth)/profile/address"
                  />
                </View>
                <Button title="Sair" variant="outline" onPress={handleSignOut} />
              </>
            )
          }

        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

