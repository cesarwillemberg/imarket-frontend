import { createCommonStyles } from "@/src/assets/styles/commonStyles";
import HeaderScreen from "@/src/components/common/HeaderScreen";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { Subtitle } from "@/src/components/common/subtitle";
import { useTheme } from "@/src/themes/ThemeContext";
import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";
import createStyles from "./styled";

export default function SelectAddress() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const commonStyles = createCommonStyles(theme);
  const router = useRouter();

  return (
    <ScreenContainer>
      <ScrollView>
        <HeaderScreen title="Meus Endereços" showButtonBack />
        <>
          <View style={{ marginVertical: 20}}>
            <Subtitle align="center" style={{ fontSize: 20 }}>Selecione um endereço no mapa</Subtitle>
          </View>
          <View>

          </View>
        </>

      </ScrollView>
    </ScreenContainer>
  );
}

