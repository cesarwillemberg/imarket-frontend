import { createCommonStyles } from "@/src/assets/styles/commonStyles";
import { createTextStyles } from "@/src/assets/styles/textStyles";
import { ScreenContainer } from "@/src/components/common/ScreenContainer";
import { useSession } from "@/src/providers/SessionContext/Index";
import { useTheme } from "@/src/themes/ThemeContext";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
import createStyles from "./styled";

export default function Home() {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const commonStyles = createCommonStyles(theme);
    const textStyles = createTextStyles(theme);
    const router = useRouter();
    const { session } = useSession();

    useEffect(() => {
        if (!session) return router.replace("/signin")
    }, [session, router])

    return (
        <ScreenContainer>
            <View style={commonStyles.centeredContainer}>
                <Text style={textStyles.themedText}>Home</Text>
            </View>
        </ScreenContainer>
    );
}