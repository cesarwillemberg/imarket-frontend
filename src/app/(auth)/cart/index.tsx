import { createCommonStyles } from "@/src/assets/styles/commonStyles";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { useTheme } from "@/src/themes/ThemeContext";
import { Text, View } from "react-native";
import createStyles from "./styled";

export default function Cart() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const commonStyles = createCommonStyles(theme);

  return (
    <ScreenContainer>
      <View style={commonStyles.centeredContainer}>
        <Text style={{color: theme.colors.text}}>Carrinho</Text>
      </View>
    </ScreenContainer>
  );
}