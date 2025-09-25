import { useTheme } from "@/themes/ThemeContext";
import { FC } from "react";
import { Text, View } from "react-native";
import BackButton from "../BackButton";
import createStyles from "./styled";

interface Props {
    title?: string;
    showButtonBack?: boolean;
}

const HeaderScreen: FC<Props> = ({ title, showButtonBack }) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    return (
        <View style={{ 
            borderBottomWidth: 2,
            borderBottomColor: theme.colors.primary,
            paddingVertical: 15
        }}>
            <View style={[styles.container, !showButtonBack ? { justifyContent: "center" } : {}] }>
                <View style={[styles.wrapper_back_button, !showButtonBack ? { display: "none" } : {}]}>
                    <BackButton />
                </View>
                <View style={styles.wrapper_title}>
                    <Text style={styles.title}>
                        {title}
                    </Text>
                </View>
                <View style={[styles.wrapper, !showButtonBack ? { display: "none" } : {}]} />
            </View>
        </View>
    )
}

export default HeaderScreen;