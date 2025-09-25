import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { Icon } from "@/src/components/common/Icon";
import { useTheme } from "@/themes/ThemeContext";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import createStyles from "./styled";

export function FloatingActionButton() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [open, setOpen] = useState(false);

  // animação
  const progress = useSharedValue(0);

  const toggleMenu = () => {
    setOpen(!open);
    progress.value = withTiming(open ? 0 : 1, { duration: 300 });
  };

  const style1 = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(progress.value, [0, 1], [0, -80]) }],
    opacity: progress.value,
  }));

  const style2 = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(progress.value, [0, 1], [0, -150]) }],
    opacity: progress.value,
  }));

  return (
    <View style={styles.container}>
      {/* Botão: Buscar endereço */}
      <Animated.View style={[styles.animatedWrapper, style1]}>
        <TouchableOpacity style={[styles.buttonOption, { backgroundColor: theme.colors.primary }]}>
          <Icon
            name="magnify"
            type="MaterialCommunityIcons"
            size={20}
            color={"white"}
          />
          <Text style={[styles.optionText]}>
            Buscar endereço
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Botão: Usar localização */}
      <Animated.View style={[styles.animatedWrapper, style2]}>
        <TouchableOpacity style={[styles.buttonOption, { backgroundColor: theme.colors.primary }]}>
          <Icon
            name="crosshairs-gps"
            type="MaterialCommunityIcons"
            size={20}
            color={"white"}
          />
          <Text style={[styles.optionText]}>
            Usar localização
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Botão principal (FAB) */}
      <TouchableOpacity
        onPress={toggleMenu}
        style={[styles.fab]}
      >
        <Icon
          name={open ? "close" : "map-marker-plus-outline"}
          type="MaterialCommunityIcons"
          size={28}
          color={"white"}
        />
      </TouchableOpacity>
    </View>
  );

}
