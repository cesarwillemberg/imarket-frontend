import HeaderScreen from "@/src/components/common/HeaderScreen";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { useTheme } from "@/src/themes/ThemeContext";
import { Text, View } from "react-native";
import createCommonStyles from "./styled";

export default function Chats() {
  const { theme } = useTheme();
  const commonStyles = createCommonStyles(theme);

  return (
    <ScreenContainer>
      <HeaderScreen title={"Conversas"} />
      <View style={commonStyles.centeredContainer}>
        <Text style={{color: theme.colors.text}}>Conversas</Text>
      </View>
    </ScreenContainer>
  );
}

