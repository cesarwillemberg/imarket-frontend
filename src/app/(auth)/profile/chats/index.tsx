import HeaderScreen from "@/src/components/common/HeaderScreen";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { useTheme } from "@/src/themes/ThemeContext";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import createStyles from "./styled";

export default function Chats() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();

  return (
    <ScreenContainer>
      <HeaderScreen title={"Conversas"} />
      <View style={styles.container}>
        <Text style={{color: theme.colors.text}}>Conversas</Text>
      </View>
    </ScreenContainer>
  );
}

