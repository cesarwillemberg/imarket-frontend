import {
  Feather,
  FontAwesome,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import type { ComponentProps } from "react";

type FontAwesomeName = ComponentProps<typeof FontAwesome>["name"];
type FeatherName = ComponentProps<typeof Feather>["name"];
type MaterialIcons = ComponentProps<typeof MaterialIcons>["name"];
type MaterialCommunityName = ComponentProps<
  typeof MaterialCommunityIcons
>["name"];

export type IconType = "fontawesome" | "MaterialCommunityIcons" | "feather" | "MaterialIcons";
export type IconName = FontAwesomeName | FeatherName | MaterialCommunityName | MaterialIconsName;

type IconProps = {
  type: IconType;
  name: IconName;
  size?: number;
  color?: string;
};

export function Icon({ type, name, size = 24, color = "black" }: IconProps) {
  if (type === "feather") {
    return <Feather name={name as FeatherName} size={size} color={color} />;
  } else if (type === "MaterialCommunityIcons") {
    return <MaterialCommunityIcons name={name} size={size} color={color} />;
  } else if (type === "MaterialIcons") {
    return <MaterialIcons name={name} size={size} color={color} />;
  }
  return (
    <FontAwesome name={name as FontAwesomeName} size={size} color={color} />
  );
}
