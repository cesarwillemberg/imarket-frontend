import { createCommonStyles } from "@/src/assets/styles/commonStyles";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { useTheme } from "@/src/themes/ThemeContext";
import { Text, View } from "react-native";

export default function Store() {
  const { theme } = useTheme();
  const commonStyles = createCommonStyles(theme);
  return (
    <ScreenContainer>
      <View style={commonStyles.centeredContainer}>
        <Text style={{color: theme.colors.text}}>Loja</Text>
      </View>
    </ScreenContainer>
  );
}
