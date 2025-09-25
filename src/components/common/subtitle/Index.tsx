import { useTheme } from "@/themes/ThemeContext";
import { FC, ReactNode } from "react";
import { Text, TextStyle } from "react-native";
import createStyles from "./Styles";

interface Props {
  children: ReactNode;
  style?: TextStyle;
  align?: "left" | "center" | "right";
}

export const Subtitle: FC<Props> = ({ children, align, style }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  return (
    <Text style={[styles.subtitle, { textAlign: align }, style]}>{children}</Text>
  );
};
