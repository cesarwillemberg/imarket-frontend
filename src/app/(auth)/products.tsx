import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { Theme, useTheme } from "@/src/themes/ThemeContext";
import { StyleSheet, Text, View } from "react-native";

export default function Products() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  return (
    <ScreenContainer>
      <View style={styles.container}>
        <Text style={{color: theme.colors.text}}>Produtos</Text>
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