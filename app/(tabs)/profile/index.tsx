import { Button } from "@/components/common/Button";
import { ScreenContainer } from "@/components/common/ScreenContainer/Index";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/providers/SessionContext/Index";
import { Theme, useTheme } from "@/themes/ThemeContext";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function Profile() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { signOut, user } = useSession();
  const router = useRouter();

  const handleGetInfoUser = async () => {
    const { data, error } = await supabase.from("perfis").select("*").eq("id", user?.id).single();

    console.log(data);
    
  }

  const handleSignOut = () => {
    signOut()
  }
  return (
    <ScreenContainer>
      <View style={styles.container}>
        <View>
          <Text  style={{color: theme.colors.text}}>
          </Text>
        </View>
        <Text style={{color: theme.colors.text}}>Perfil</Text>

        <Button title="Sair" variant="outline" onPress={handleSignOut} />
        <Button title="Dados Usuario" variant="outline" onPress={handleGetInfoUser} />
        <Button title="Teste" variant="outline" onPress={() => router.push('/(tabs)/profile/teste')} />
      </View>
    </ScreenContainer>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});