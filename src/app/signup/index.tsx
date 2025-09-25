import { SignUpForm } from "@/src/components/auth/SignUpForm";
import HeaderScreen from "@/src/components/common/HeaderScreen";
import Logo from "@/src/components/common/Logo";
import { ScreenContainer } from "@/src/components/common/ScreenContainer/Index";
import { useTheme } from "@/themes/ThemeContext";
import { ScrollView, View } from "react-native";
import createStyles from "./styled";

const SignUpScreen = () => {
    const { theme, currentTheme } = useTheme();
    const styles = createStyles(theme);

    return (
        <ScreenContainer style={{ flex: 1 }}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center" }}
                keyboardShouldPersistTaps="handled"
            >
                <HeaderScreen  />
                <Logo />
                <View style={styles.form_wrapper}>
                    <SignUpForm />
                </View>
            </ScrollView>
        </ScreenContainer>
    );
};

export default SignUpScreen;