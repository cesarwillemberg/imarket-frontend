import { Icon, IconName, IconType } from "@/src/components/common/Icon";
import { useTheme } from "@/src/themes/ThemeContext";
import { ForwardedRef, forwardRef } from "react";
import {
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
  StyleProp,
  TextStyle,
} from "react-native";
import createStyles from "./styled";

type IconConfig = {
  type: IconType;
  name: IconName;
  size?: number;
  color?: string;
};

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  showIcon?: boolean;
  icon?: IconConfig;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  inputProps?: Omit<TextInputProps, "style" | "value" | "onChangeText" | "placeholder">;
};

export const SearchBar = forwardRef<TextInput, SearchBarProps>(
  (
    {
      value,
      onChangeText,
      placeholder = "Buscar...",
      showIcon = true,
      icon,
      containerStyle,
      inputStyle,
      inputProps,
    },
    ref: ForwardedRef<TextInput>
  ) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    const resolvedIcon: IconConfig = icon ?? {
      type: "feather",
      name: "search",
      size: 18,
      color: theme.colors.primary,
    };

    return (
      <View style={[styles.wrapper, containerStyle]}>
        {showIcon ? (
          <View style={styles.iconWrapper}>
            <Icon
              type={resolvedIcon.type}
              name={resolvedIcon.name}
              size={resolvedIcon.size ?? 18}
              color={resolvedIcon.color ?? theme.colors.primary}
            />
          </View>
        ) : null}
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.disabled}
          style={[styles.input, inputStyle]}
          returnKeyType="search"
          {...inputProps}
        />
      </View>
    );
  }
);

SearchBar.displayName = "SearchBar";

export default SearchBar;
