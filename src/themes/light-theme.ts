export const COLORS = {
  primary: "#FB0202",
  onPrimary: "#FFFFFF",

  secondary: "#F5F5F5",
  onSecondary: "#FFFFFF",

  background: "#F6F4F6",
  surface: "#FFFFFF",
  onSurface: "#1C1B1F",

  background_forms: "#FFFFFF",

  success: "#00C853",
  danger: "#D32F2F",
  warning: "#FFA000",
  info: "#0288D1",

  border: "#E0E0E0",
  disabled: "#C7C7C7",
  text: "#000000",

  shadow: "rgba(0, 0, 0, 0.08)",
};

export const SPACING = {
  clear: 0,
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

const lightTheme = {
  colors: COLORS,
  spacing: SPACING,
  fontSizes: FONT_SIZES,
  fonts: FONTS,
  radius: RADIUS,
  opacity: OPACITY,
  size: SIZE,
};

export default lightTheme;
