import { useTheme } from "@/src/themes/ThemeContext";
import { FC, ReactNode } from "react";
import { Text, TextStyle } from "react-native";
import createStyles from "./styles";

interface Props {
  children: ReactNode;
  style?: TextStyle;
  align?: "left" | "center" | "right";
}

export const Title: FC<Props> = ({ children, align, style }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  return (
    <Text style={[styles.title, { textAlign: align }, style]}>{children}</Text>
  );
};
