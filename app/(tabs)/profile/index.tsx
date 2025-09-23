import ProfielPictureAndName from "@/components/auth/profile/ProfilePictureandName";
import { Button } from "@/components/common/Button";
import ProfileButton from "@/components/common/ProfileButton";
import { ScreenContainer } from "@/components/common/ScreenContainer/Index";
import { useSession } from "@/providers/SessionContext/Index";
import { useTheme } from "@/themes/ThemeContext";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, View } from "react-native";
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

  const handleGetInfoUser = async () => {
    if (!user) return null;    
    const data = await getInfoUser({id: user.id});
    setName(data?.nome)
    setProfilePicture(data?.profile_picture)
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


  const handleSignOut = () => {
    signOut()
  }

  return (
    <ScreenContainer>
      <View style={{ flex: 1, paddingVertical: 20}}>
        <ScrollView
          contentContainerStyle={[styles.container, isLoading ? { justifyContent: "center" } : {}]}
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
            isLoading ? (
              <ActivityIndicator size="large" color={theme.colors.primary} />
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
                    linkPage="/(tabs)/profile/chats"
                  />
                  <ProfileButton
                    iconName="bell-outline" 
                    iconType="MaterialCommunityIcons" 
                    title="Notificações"
                    linkPage="/(tabs)/profile/notifications"
                  />
                  <ProfileButton
                    iconName="card-account-details-outline" 
                    iconType="MaterialCommunityIcons" 
                    title="Informações do Perfil"
                    linkPage="/(tabs)/profile/viewprofile"
                  />
                  <ProfileButton
                    iconName="credit-card" 
                    iconType="fontawesome" 
                    title="Formas de Pagamento"
                    linkPage="/(tabs)/profile/payments"
                  />
                  <ProfileButton
                    iconName="map-marker-outline" 
                    iconType="MaterialCommunityIcons" 
                    title="Meus Endereços"
                    linkPage="/(tabs)/profile/address"
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

