export const DARK_COLORS = {
  primary: "#FB0202",
  onPrimary: "#FFFFFF",

  secondary: "#222222ff",
  onSecondary: "#332D41",

  background: "#121212",
  surface: "#1E1E1E",
  onSurface: "#E6E1E5",

  background_forms: "#181717ff",

  success: "#00E676",
  danger: "#EF5350",
  warning: "#FFCA28",
  info: "#29B6F6",

  border: "#818181ff",
  disabled: "#666666",
  text: "#FFFFFF",

  shadow: "rgba(0, 0, 0, 0.6)",
};

export const SPACING = {
  clear: 0,
  sx: 2,
  xs: 4,
  sm: 8,
  ms: 10,
  md: 16,
  gl: 20,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  gl: 18,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const FONTS = {
  regular: 'Inter',
  italic: 'Inter-Italic',
  mono: 'SpaceMono',
};

export const RADIUS = {
  clear: 0,
  sm: 4,
  md: 8,
  lg: 10,
  xl: 12,
  xxl: 16,
  full: 999,
};

export const OPACITY = {
  disabled: 0.4,
  hover: 0.8,
  pressed: 0.6,
};

export const SIZE = {
  clear: 0,
  xs: 1,
  sm: 2,
  md: 4,
  lg: 8,
  xl: 16,
  xxl: 32,
};

const darkTheme = {
  colors: DARK_COLORS,
  spacing: SPACING,
  fontSizes: FONT_SIZES,
  fonts: FONTS,
  radius: RADIUS,
  opacity: OPACITY,
  size: SIZE,
};

export default darkTheme;
