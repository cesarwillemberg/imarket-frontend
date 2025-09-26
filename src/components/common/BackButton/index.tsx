import { useTheme } from "@/src/themes/ThemeContext";
import { useRouter } from "expo-router";
import { FC } from "react";
import { TouchableOpacity, View } from "react-native";
import { Icon } from "../Icon";

const BackButton: FC = () => {
    const { theme } = useTheme();
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