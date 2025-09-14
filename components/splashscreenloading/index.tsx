
import { useTheme } from "@/themes/ThemeContext";
import createStyles from "./styled";

import LogoLight from "@/assets/images/splashscreen/logo.svg";
import LogoDark from "@/assets/images/splashscreen/logo_dark.svg";
import { ScreenContainer } from "../common/ScreenContainer/Index";

export default function SplashScreenLoading(){
    const { currentTheme, theme } = useTheme();
    const styles = createStyles(theme);

    return (
        <ScreenContainer style={styles.container}>
            {
                currentTheme === "light" ? (
                    <LogoLight width={250} height={250} />
                ) : (
                    <LogoDark width={250} height={250} />
                )
            }
        </ScreenContainer>
    )
}