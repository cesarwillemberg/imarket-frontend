import { useTheme } from "@/themes/ThemeContext";
import ExpoCheckbox from "expo-checkbox";
import { StyleProp, Text, View, ViewStyle } from "react-native";
import createStyles from "./styled";

interface CheckboxProps {
    label: string;
    checked: boolean;               
    onChange: (value: boolean) => void; 
    styleView?: ViewStyle; 
    styleCheckbox?: StyleProp<ViewStyle>;
}

const ThemedCheckbox  = ({label, styleView, styleCheckbox, checked, onChange }: CheckboxProps) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    
    return (
        <View style={[styles.container_checkbox, styleView]}>
            <ExpoCheckbox 
                value={checked}
                onValueChange={onChange}
                style={[styles.checkbox, styleCheckbox]}
                color={checked ? theme.colors.primary : undefined}
            />
            <Text style={styles.stay_conected}>{label}</Text>
        </View>
    )
}

export default ThemedCheckbox;