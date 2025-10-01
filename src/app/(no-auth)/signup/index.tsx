import { createCommonStyles } from "@/src/assets/styles/commonStyles";
import { SignUpForm } from "@/src/components/auth/SignUpForm";
import HeaderScreen from "@/src/components/common/HeaderScreen";
import Logo from "@/src/components/common/Logo";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { useTheme } from "@/src/themes/ThemeContext";
import { View } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import createStyles from "./styled";

const SignUpScreen = () => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const stylesCommon = createCommonStyles(theme);

    return (
        <ScreenContainer>
            <KeyboardAwareScrollView
                enableOnAndroid
                contentContainerStyle={stylesCommon.growContainer}
                keyboardShouldPersistTaps="handled"
                extraScrollHeight={40}
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
            </KeyboardAwareScrollView>
        </ScreenContainer>
    );
};

export default SignUpScreen;