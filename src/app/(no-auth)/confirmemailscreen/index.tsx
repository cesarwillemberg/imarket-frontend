import { Button } from "@/src/components/common/Button";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { Title } from "@/src/components/common/Title/index";
import { useTheme } from "@/src/themes/ThemeContext";
import { router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import createStyles from "./styled";

import LogoLight from "@/src/assets/images/splashscreen/logo.svg";
import LogoDark from "@/src/assets/images/splashscreen/logo_dark.svg";
import HeaderScreen from "@/src/components/common/HeaderScreen";

export default function ConfirmEmailScreen() {;
    const { email } = useLocalSearchParams();
    const { theme, currentTheme } = useTheme();
    const styles = createStyles(theme);
    return (
        <ScreenContainer style={{ justifyContent: "center" }}>
            <HeaderScreen />
            <View style={styles.logo_wrapper}>
                {currentTheme === "light" ? (
                    <LogoLight width={250} height={250} />
                ) : (
                    <LogoDark width={250} height={250} />
                )}
            </View>
            <View>
                <Text style={{color: theme.colors.text, alignItems: "center", justifyContent: "center", textAlign: "center"}}>Foi enviado um email de confirmação para o seguinte email:</Text>
                <Title align="center" >{email}</Title>
            </View>

            <Button title="Back to Sign In" onPress={() => router.replace("/signin") } />
        </ScreenContainer>
    )
}