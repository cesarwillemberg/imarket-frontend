import { ScreenContainer } from "@/components/common/ScreenContainer/Index";
import { Theme, useTheme } from "@/themes/ThemeContext";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function Teste() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <Text>Teste</Text>
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