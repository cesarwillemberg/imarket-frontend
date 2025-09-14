import { ScreenContainer } from "@/components/common/ScreenContainer/Index";
import { useSession } from "@/providers/SessionContext/Index";
import { Theme, useTheme } from "@/themes/ThemeContext";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Home() {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const router = useRouter();
    const { session, user} = useSession();

    useEffect(() => {
        if (!session) return router.replace("/signin")
    }, [session, router])

    return (
        <ScreenContainer>
            <View style={styles.container}>
                <Text style={{color: theme.colors.text}}>Home</Text>
            </View>
        </ScreenContainer>
    );
}


const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});