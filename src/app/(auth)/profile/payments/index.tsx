import HeaderScreen from "@/src/components/common/HeaderScreen";
import { ScreenContainer } from "@/src/components/common/ScreenContainer/Index";
import { useTheme } from "@/themes/ThemeContext";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import createStyles from "./styled";

export default function Payments() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();

  return (
    <ScreenContainer>
      <HeaderScreen title={"Formas de Pagamentos"} />
      <View style={styles.container}>
        <Text style={{color: theme.colors.text}}>Pagamentos</Text>
      </View>
    </ScreenContainer>
  );
}

