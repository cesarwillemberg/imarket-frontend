
import { useTheme } from "@/themes/ThemeContext";
import { FC } from "react";
import {
  ActivityIndicator,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import createStyles from "./Styled";

type ButtonVariant = "primary" | "outline" | "danger" | "success";

interface Props {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
}

export const Button: FC<Props> = ({
  onPress,
  title,
  disabled,
  loading,
  style,
  textStyle,
  variant = "primary",
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const variantStyles = {
    primary: {
      backgroundColor: theme.colors.primary,
    },
    outline: {
      borderColor: theme.colors.primary,
      borderWidth: 2,
      backgroundColor: "transparent",
    },
    danger: {
      backgroundColor: theme.colors.danger,
    },
    success: {
      backgroundColor: theme.colors.success,
    },
  };

  const textColor =
    variant === "outline" ? theme.colors.primary : theme.colors.onPrimary;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        variantStyles[variant],
        disabled && { opacity: theme.opacity.disabled },
        style,
      ]}
    >
      {loading && <ActivityIndicator color={textColor} />}
      {!loading && (
        <Text style={[styles.text, { color: textColor }, textStyle]}>
          {String(title)}
        </Text>
      )}
    </TouchableOpacity>
  );
};
