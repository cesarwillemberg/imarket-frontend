import { createCommonStyles } from "@/src/assets/styles/commonStyles";
import { SignUpForm } from "@/src/components/auth/SignUpForm";
import HeaderScreen from "@/src/components/common/HeaderScreen";
import Logo from "@/src/components/common/Logo";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { useTheme } from "@/src/themes/ThemeContext";
import { ScrollView, View } from "react-native";
import createStyles from "./styled";

const SignUpScreen = () => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const stylesCommon = createCommonStyles(theme);

    return (
        <ScreenContainer>
            <ScrollView
                contentContainerStyle={stylesCommon.growContainer}
                keyboardShouldPersistTaps="handled"
            >
                <HeaderScreen 
                    title="Criar Conta" 
                    showButtonBack 
                />
                <View style={stylesCommon.paddedContainer}>
                    <Logo />
                    <View style={styles.form_wrapper}>
                        <SignUpForm />
                    </View>
                </View>
            </ScrollView>
        </ScreenContainer>
    );
};

export default SignUpScreen;