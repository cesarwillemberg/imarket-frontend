import { Theme } from "@/src/themes/ThemeContext";
import { TextStyle } from "react-native";

export const createTextStyles = (theme: Theme) => ({
  // Texto padrão com cor do tema
  themedText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.regular,
  } as TextStyle,
  
  // Texto centralizado
  centeredText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.regular,
    textAlign: 'center',
  } as TextStyle,
  
  // Texto de título
  titleText: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.lg,
    fontFamily: theme.fonts.regular,
    fontWeight: 'bold',
  } as TextStyle,
  
  // Texto de subtítulo
  subtitleText: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.md,
    fontFamily: theme.fonts.regular,
  } as TextStyle,
});
