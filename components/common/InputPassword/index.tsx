import { useTheme } from "@/themes/ThemeContext";
import React, { RefObject, forwardRef } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import IconMaterialIcons from "react-native-vector-icons/MaterialIcons";
import createStyles from "./Styled";

interface PasswordInputProps {
  placeholder?: string;
  value: string;
  onValueChange: (value: string) => void;
  inputRef?: RefObject<TextInput>;
  secureTextEntry?: boolean;
  returnKeyType?: "done" | "go" | "next" | "search" | "send";
  onSubmitEditing?: () => void;
  onFocus?: () => void;
  style?: object;
  containerStyle?: object;
  isRegistration?: boolean; // New prop to differentiate registration mode
}

const InputPassword = forwardRef<TextInput, PasswordInputProps>(
  (
    {
      placeholder = "Senha",
      value,
      onValueChange,
      inputRef,
      secureTextEntry = true,
      returnKeyType = "done",
      onSubmitEditing,
      onFocus,
      style,
      containerStyle,
      isRegistration = false, // Default to false (login mode)
    },
    ref
  ) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    const [showPassword, setShowPassword] = React.useState<boolean>(
      !secureTextEntry
    );
    const [errorMessage, setErrorMessage] = React.useState<string>("");
    const [successMessage, setSuccessMessage] = React.useState<string>("");


    // Password validation function for registration
    const validatePassword = (password: string): boolean => {
      if (!isRegistration) return true; // Skip validation for login

      const minLength = password.length >= 8;
      const hasUpperCase = /[A-Z]/.test(password);
      const hasNumbers = (password.match(/[0-9]/g) || []).length >= 2;
      const hasSpecialChars = (password.match(/[!@#$%^&*(),.?":{}|<>]/g) || []).length >= 2;

      if(password === "") {
        setSuccessMessage("");
        setErrorMessage("A senha deve conter pelo menos 8 caracetres, sendo 1 letra maiúscula, 2 números e 2 caracteres especiais.")
        return false;
      }

      if (!minLength) {
        setSuccessMessage("");
        setErrorMessage("A senha deve ter pelo menos 8 caracteres.");
        return false;
      }
      if (!hasUpperCase) {
        setSuccessMessage("");
        setErrorMessage("A senha deve conter pelo menos 1 letra maiúscula.");
        return false;
      }
      if (!hasNumbers) {
        setSuccessMessage("");
        setErrorMessage("A senha deve conter pelo menos 2 números.");
        return false;
      }
      if (!hasSpecialChars) {
        setSuccessMessage("");
        setErrorMessage("A senha deve conter pelo menos 2 caracteres especiais.");
        return false;
      }

      if(minLength && hasUpperCase && hasNumbers && hasSpecialChars) {
        setErrorMessage("");
        setSuccessMessage("Atende aos requisitos minimos");
      }

      setErrorMessage(""); // Clear error if all criteria are met
      return true;
    };

    // Validate password whenever the value changes during registration
    React.useEffect(() => {
      if (isRegistration) {
        validatePassword(value);
      }
    }, [value, isRegistration]);

    return (
      <>
        <View style={[styles.container, containerStyle]}>
          <TextInput
            placeholder={placeholder}
            ref={inputRef || ref}
            value={value}
            onChangeText={(text) => {
              onValueChange(text);
              if (isRegistration) {
                validatePassword(text);
              }
            }}
            secureTextEntry={!showPassword}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
            placeholderTextColor={theme.colors.disabled}
            style={[
              styles.input,
              style,
              isRegistration && errorMessage ? styles.errorInput : null,
            ]}
            onFocus={onFocus}
            />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={{ marginLeft: 8 }}
            >
            <IconMaterialIcons
              name={showPassword ? "visibility" : "visibility-off"}
              size={20}
              color={"#C7C7C7"}
              />
          </TouchableOpacity>
        </View>
        {isRegistration && errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        {isRegistration && successMessage ? (
          <Text style={styles.successText}>{successMessage}</Text>
        ) : null}
      </>
    );
  }
);

InputPassword.displayName = "InputPassword";

export default InputPassword;