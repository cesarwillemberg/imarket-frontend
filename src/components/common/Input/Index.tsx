import { useTheme } from "@/src/themes/ThemeContext";
import React, { forwardRef } from "react";
import { TextInput, TextInputProps } from "react-native";
import createStyles from "./styled";

export const Input = forwardRef<TextInput, TextInputProps>((props, ref) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <TextInput
      ref={ref}
      {...props}
      placeholderTextColor={theme.colors.disabled}
      style={[styles.input, props.style]}
    />
  );
});

Input.displayName = "Input"; // boa prática
