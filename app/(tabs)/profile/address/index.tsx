import HeaderScreen from "@/components/common/HeaderScreen";
import { ScreenContainer } from "@/components/common/ScreenContainer/Index";
import { useTheme } from "@/themes/ThemeContext";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import createStyles from "./styled";

export default function Address() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();

  return (
    <ScreenContainer>
      <HeaderScreen title={"Meus Endereços"} />
      <View style={styles.container}>
        <Text style={{color: theme.colors.text}}>Endereços</Text>
      </View>
    </ScreenContainer>
  );
}

