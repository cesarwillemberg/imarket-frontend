import { useTheme } from "@/src/themes/ThemeContext";
import { Text } from "react-native";
import createStyles from "./styled";

const Label = ({ children, required = false }: { children: string; required?: boolean }) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    
    return (
        <Text style={styles.inputLabel}>
            {children}
            {required && <Text style={styles.requiredIndicator}> *</Text>}
        </Text>
    );
};

export default Label;