
import { useTheme } from "@/src/themes/ThemeContext";
import createStyles from "./styled";

import LogoLight from "@/src/assets/images/splashscreen/logo.svg";
import LogoDark from "@/src/assets/images/splashscreen/logo_dark.svg";
import { ScreenContainer } from "../../common/ScreenContainer";


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