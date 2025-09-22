import ProfielPictureAndName from "@/components/auth/profile/ProfilePictureandName";
import { Button } from "@/components/common/Button";
import ProfileButton from "@/components/common/ProfileButton";
import { ScreenContainer } from "@/components/common/ScreenContainer/Index";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/providers/SessionContext/Index";
import { useTheme } from "@/themes/ThemeContext";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import createStyles from "./stylde";

export default function Profile() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { signOut, user } = useSession();
  const router = useRouter();

  const [name, setName] = useState<string>();

  const [userData, setUserData] = useState<JSON | null>(null);

  const handleGetInfoUser = async () => {
    const { data, error } = await supabase
      .from("perfis")
      .select("*")
      .eq("id", user?.id)
      .single();
      setName(data?.nome)
      setUserData(data); 
  }

  const handleSignOut = () => {
    signOut()
  }

  useEffect(()=>{
    handleGetInfoUser();
  },[])

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <ProfielPictureAndName 
          name={name} 
        />
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
      </View>
    </ScreenContainer>
  );
}

