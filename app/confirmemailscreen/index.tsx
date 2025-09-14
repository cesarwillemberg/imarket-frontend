import { Button } from "@/components/common/Button";
import { ScreenContainer } from "@/components/common/ScreenContainer/Index";
import { Title } from "@/components/common/Title/Index";
import { useTheme } from "@/themes/ThemeContext";
import { router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import createStyles from "./styled";

import LogoLight from "@/assets/images/splashscreen/logo.svg";
import LogoDark from "@/assets/images/splashscreen/logo_dark.svg";

export default function ConfirmEmailScreen() {;
    const { email } = useLocalSearchParams();
    const { theme, currentTheme } = useTheme();
    const styles = createStyles(theme);
    return (
        <ScreenContainer style={{ justifyContent: "center" }}>
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