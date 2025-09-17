import { useTheme } from "@/themes/ThemeContext";
import { useRouter } from "expo-router";
import { FC } from "react";
import { TouchableOpacity, View } from "react-native";
import { Icon } from "../Icon";
import createStyles from "./styled";

interface Props {

}

const BackButton: FC<Props> = () => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const router = useRouter();

    const handleBack = () => {
        router.back()
    }

    return(
        <>
            <TouchableOpacity onPress={handleBack}>
                <View>
                    <Icon 
                        name="chevron-left" 
                        type="feather" 
                        color={theme.colors.primary} 
                        size={30} 
                    />
                </View>
            </TouchableOpacity>
        </>
    )
} 

export default BackButton;