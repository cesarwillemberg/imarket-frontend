import HeaderScreen from "@/components/common/HeaderScreen";
import { ScreenContainer } from "@/components/common/ScreenContainer/Index";
import { useTheme } from "@/themes/ThemeContext";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import createStyles from "./styled";

export default function SeeProfile() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();

  return (
    <ScreenContainer>
      <HeaderScreen title="Meu Perfil" />
      <View style={styles.container}>
        <Text style={{color: theme.colors.text}}>Ver Perfil</Text>
      </View>
    </ScreenContainer>
  );
}

