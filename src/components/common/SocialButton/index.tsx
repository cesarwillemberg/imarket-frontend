import { useTheme } from "@/src/themes/ThemeContext";
import React, { FC, ReactElement } from "react";
import { Pressable } from "react-native";
import createStyles, { getSocialButtonStyle } from "./styled";

interface SocialButtonProps {
  icon: ReactElement<{ width?: number; height?: number }>;
  onPress: () => void;
  size?: number;
}

const SocialButton: FC<SocialButtonProps> = ({icon, onPress, size}) => {

    const { theme } = useTheme();
    const styles = createStyles(theme);

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.social_button_base,
                getSocialButtonStyle(pressed, theme),
            ]}
        >
            {icon}
        </Pressable>
    );
}

export default SocialButton;