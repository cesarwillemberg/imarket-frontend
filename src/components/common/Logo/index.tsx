import { View } from "react-native";

import LogoLight from "@/src/assets/images/splashscreen/logo.svg";
import LogoDark from "@/src/assets/images/splashscreen/logo_dark.svg";
import { useTheme } from "@/src/themes/ThemeContext";
import createStyles from "./styled";

const Logo = () => {
    const { theme, currentTheme } = useTheme();
    const styles = createStyles(theme);
    return (
        <View style={styles.logo_wrapper}>
            {currentTheme === "light" ? (
                <LogoLight width={250} height={180} />
            ) : (
                <LogoDark width={250} height={180} />
            )}
        </View>
    )
}

export default Logo;