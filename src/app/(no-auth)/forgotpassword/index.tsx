import { createCommonStyles } from "@/src/assets/styles/commonStyles";
import HeaderScreen from "@/src/components/common/HeaderScreen";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { useTheme } from "@/src/themes/ThemeContext";
import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import createStyles from "./styled";


export default function ForgotPassword() {
    const { theme, } = useTheme();
    const styles = createStyles(theme);
    const stylesCommon = createCommonStyles(theme);
    const router = useRouter();

    return (
        <ScreenContainer style={stylesCommon.centeredContainer}>
            <HeaderScreen title="Recuperar Senha" showButtonBack />
            <View style={stylesCommon.centeredContainer}>
                <ScrollView >
                    <Text style={{ color: theme.colors.text}}>Forgot Password</Text>
                </ScrollView>
            </View>
        </ScreenContainer>
    )

}