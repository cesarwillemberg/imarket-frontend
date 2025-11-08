import { createCommonStyles } from "@/src/assets/styles/commonStyles";
import { SignUpForm } from "@/src/components/auth/SignUpForm";
import HeaderScreen from "@/src/components/common/HeaderScreen";
import Logo from "@/src/components/common/Logo";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { useTheme } from "@/src/themes/ThemeContext";
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar, View } from "react-native";
import createStyles from "./styled";

const SignUpScreen = () => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const stylesCommon = createCommonStyles(theme);
    const isAndroid = Platform.OS === "android";
    const keyboardVerticalOffset = isAndroid
        ? (StatusBar.currentHeight ?? 0) + theme.spacing.lg
        : 0;

    return (
        <ScreenContainer>
            <KeyboardAvoidingView
                style={stylesCommon.flexContainer}
                behavior={isAndroid ? "height" : "padding"}
                keyboardVerticalOffset={keyboardVerticalOffset}
                enabled={isAndroid}
            >
                <ScrollView
                    contentContainerStyle={stylesCommon.growContainer}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
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
            </KeyboardAvoidingView>
        </ScreenContainer>
    );
};

export default SignUpScreen;
