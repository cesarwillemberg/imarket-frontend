import HeaderScreen from "@/src/components/common/HeaderScreen";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { useTheme } from "@/src/themes/ThemeContext";
import { Text, View } from "react-native";
import createCommonStyles from "./styled";

export default function Notifications() {
  const { theme } = useTheme();
  const commonStyles = createCommonStyles(theme);

  return (
    <ScreenContainer>
      <HeaderScreen title="Notificações" showButtonBack />
      <View style={commonStyles.centeredContainer}>
        <Text style={{color: theme.colors.text}}>Notificações</Text>
      </View>
    </ScreenContainer>
  );
}

