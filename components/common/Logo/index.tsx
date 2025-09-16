import { View } from "react-native";

import LogoLight from "@/assets/images/splashscreen/logo.svg";
import LogoDark from "@/assets/images/splashscreen/logo_dark.svg";
import { useTheme } from "@/themes/ThemeContext";
import createStyles from "./styled";

const Logo = () => {
    const { theme, currentTheme } = useTheme();
    const styles = createStyles(theme);
    return (
        <View style={styles.logo_wrapper}>
            {currentTheme === "light" ? (
                <LogoLight width={250} height={250} />
            ) : (
                <LogoDark width={250} height={250} />
            )}
        </View>
    )
}

export default Logo;