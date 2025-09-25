import { ScreenContainer } from "@/src/components/common/ScreenContainer/Index";
import { Theme, useTheme } from "@/themes/ThemeContext";
import { StyleSheet, Text, View } from "react-native";

export default function Cart() {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <Text style={{color: theme.colors.text}}>Carrinho</Text>
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