import { ScreenContainer } from "@/components/common/ScreenContainer/Index";
import { useTheme } from "@/themes/ThemeContext";
import { ScrollView, View } from "react-native"; // Adicionei ScrollView aqui

import LogoLight from "@/assets/images/splashscreen/logo.svg";
import LogoDark from "@/assets/images/splashscreen/logo_dark.svg";
import { SignUpForm } from "@/components/auth/SignUpForm";
import createStyles from "./styled";

const SignUpScreen = () => {
    const { theme, currentTheme } = useTheme();
    const styles = createStyles(theme);

    return (
        <ScreenContainer style={{ flex: 1 }}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center" }}
                keyboardShouldPersistTaps="handled"  // Opcional: melhora a interação com o teclado no formulário
            >
                <View style={styles.logo_wrapper}>
                    {currentTheme === "light" ? (
                        <LogoLight width={250} height={250} />
                    ) : (
                        <LogoDark width={250} height={250} />
                    )}
                </View>
                <View style={styles.form_wrapper}>
                    <SignUpForm />
                </View>
            </ScrollView>
        </ScreenContainer>
    );
};

export default SignUpScreen;