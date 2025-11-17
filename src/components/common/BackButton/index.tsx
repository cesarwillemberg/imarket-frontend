import { useTheme } from "@/src/themes/ThemeContext";
import { useRouter } from "expo-router";
import { FC } from "react";
import { TouchableOpacity, View } from "react-native";
import { Icon } from "../Icon";

interface BackButtonProps {
    onPress?: () => void;
}

const BackButton: FC<BackButtonProps> = ({ onPress }) => {
    const { theme } = useTheme();
    const router = useRouter();

    const handleBack = () => {
        if (typeof onPress === "function") {
            onPress();
            return;
        }
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
