import { Button } from "@/components/common/Button";
import ProfileButton from "@/components/common/ProfileButton";
import { ScreenContainer } from "@/components/common/ScreenContainer/Index";
import { Title } from "@/components/common/Title/Index";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/providers/SessionContext/Index";
import { useTheme } from "@/themes/ThemeContext";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, View } from "react-native";
import createStyles from "./stylde";

export default function Profile() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { signOut, user } = useSession();
  const router = useRouter();

  const [name, setName] = useState<string>();

  const handleGetInfoUser = async () => {
    const { data:user_data, error } = await supabase
      .from("perfis")
      .select("*")
      .eq("id", user?.id)
      .single();
      
      setName(user_data?.nome)
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
        <View style={{
          alignItems: "center", 
          // justifyContent: "center", 
          // flexDirection: "row", 
          marginVertical: 30
        }}>
          <View style={{marginBottom: 10}}>
            <Image 
              source={require("@/assets/images/profile/img_profile.jpg")}
              style={{
                width: 120, 
                height: 120, 
                borderRadius: 999, 
                borderWidth: 2,
                borderColor: theme.colors.primary
              }}
            />    
          </View>
          <Title style={{ marginLeft: 10, fontSize: theme.fontSizes.lg}}>{name}</Title>
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
            linkPage="/(tabs)/profile/seeprofile"
          />
        </View>


        <Button title="Sair" variant="outline" onPress={handleSignOut} />
      </View>
    </ScreenContainer>
  );
}

