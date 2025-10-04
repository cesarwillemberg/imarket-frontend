import { useTheme } from "@/src/themes/ThemeContext";
import { TouchableOpacity, View } from "react-native";
import { Icon } from "../../common/Icon";

const addressOptions = [
  { id: "home", icon: "home-outline", label: "Casa" },
  { id: "work", icon: "briefcase-outline", label: "Trabalho" },
  { id: "love", icon: "heart-outline", label: "Amor" },
  { id: "school", icon: "school-outline", label: "Escola" },
  { id: "friend", icon: "account-multiple-outline", label: "Amigo" },
  { id: "other", icon: "map-marker-outline", label: "Outro" },
];

interface AddressTypeProps {
    addressType: string;
    setAddressType: (type: string) => void;
}

export default function AddressType({ addressType, setAddressType }: AddressTypeProps) {
  const { theme } = useTheme();

  return (
    <View>
        <View style={{ flexDirection: "row" }}>
            {addressOptions.map((option) => {
                const isSelected = addressType === option.id;
                return (
                    <TouchableOpacity
                        key={option.id}
                        onPress={() => setAddressType(option.id)}
                        style={{
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: theme.spacing.md,
                        }}
                        >
                        <Icon
                            type="MaterialCommunityIcons"
                            name={option.icon}
                            size={28}
                            color={
                                isSelected ? theme.colors.primary : theme.colors.text
                            }
                        />
                    </TouchableOpacity>
                );
            })}
        </View>
    </View>
  );
}
