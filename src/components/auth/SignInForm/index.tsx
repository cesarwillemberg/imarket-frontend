import { useSession } from "@/providers/SessionContext/Index";
import { Button } from "@/src/components/common/Button";
import { Input } from "@/src/components/common/Input/Index";
import InputPassword from "@/src/components/common/InputPassword";
import { Subtitle } from "@/src/components/common/subtitle/Index";
import ThemedCheckbox from "@/src/components/common/ThemedCheckbox";
import { Title } from "@/src/components/common/Title/Index";
import { useTheme } from "@/themes/ThemeContext";
import { useRef, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import createStyles from "./styled";

export const SignInForm = () => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const { signIn } = useSession();

    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
   
    const [isChecked, setIsChecked] = useState<boolean>(false);
    const [loagind, setLoading] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);

    const passwordRef = useRef<TextInput>(null);


    const handleSingIn = async () => {
        setLoading(true);
        await signIn(email,password);
        setEmail("");
        setPassword("");
        setLoading(false);
    }


    return (
        <View>
            <Title align="center" style={{marginBottom: 0}}>Entrar</Title>
            <Subtitle align="center">Por favor, faça login com a sua conta</Subtitle>
            <View style={styles.input_group}>
                <Text style={styles.label}>EMAIL</Text>
                <Input
                    placeholder="Email"
                    inputMode="email"
                    value={email}

                    onChangeText={setEmail}
                />
            </View>
            <View style={styles.input_group}>
                <Text style={styles.label}>SENHA</Text>
                <InputPassword
                    placeholder="Password"
                    value={password}
                    onValueChange={setPassword}
                    inputRef={passwordRef}
                    returnKeyType="done"
                    secureTextEntry={!showPassword}
                />
            </View>
            <View style={styles.options_row}>
                <ThemedCheckbox label="mantenha-me conectado." checked={isChecked} onChange={setIsChecked}  />
                <TouchableOpacity>
                    <Text style={styles.forgot_password_text}>
                        Esqueceu a senha?
                    </Text>
                </TouchableOpacity>
            </View>
            <View style={styles.submit_button_wrapper}>
                <Button
                    title="ENTRAR"
                    style={styles.login_button}
                    onPress={handleSingIn}
                />
            </View>
        </View>
    )

}