import { useTheme } from "@/themes/ThemeContext";
import { FC } from "react";
import { Text, View } from "react-native";
import BackButton from "../BackButton";
import createStyles from "./styled";

interface Props {
    title?: string;
}

const HeaderScreen: FC<Props> = ({ title }) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    return (
        <>
            <View style={styles.container}>
                <View style={styles.wrapper_back_button}>
                    <BackButton />
                </View>
                <View style={styles.wrapper_title}>
                    <Text style={styles.title}>
                        {title}
                    </Text>
                </View>
                <View style={styles.wrapper} />
            </View>
        </>
    )
}

export default HeaderScreen;