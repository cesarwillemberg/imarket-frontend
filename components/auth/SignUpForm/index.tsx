
import { useTheme } from "@/themes/ThemeContext";

import { Input } from "@/components/common/Input/Index";
import { Subtitle } from "@/components/common/subtitle/Index";
import { Title } from "@/components/common/Title/Index";

import { Button } from "@/components/common/Button";
import DatePickerInput from "@/components/common/DatePickerInput";
import EmailInput from "@/components/common/InputEmail";
import InputPassword from "@/components/common/InputPassword";
import PhoneInput from "@/components/common/PhoneInput";
import { useSession } from "@/providers/SessionContext/Index";
import Checkbox from "expo-checkbox";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import createStyles from "./styled";

export const SignUpForm = () => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const { signUp } = useSession();
    const router = useRouter();

    const [name, setName] = useState<string>("");
    const [cpf, setCPF] = useState<string>("");
    const [dateOfBirth, setDateOfBirth] = useState<string>("");
    const [phone, setPhone] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [isChecked, setIsChecked] = useState<boolean>(false);

    const handleDateChange = (date: Date, formattedDate: string) => {
        setDateOfBirth(formattedDate);
    };

    const handleSignUp = async () => {
        if (password !== confirmPassword) {
            Alert.alert("Error", "Password do not match!");
            return;
        }

        if (!isChecked) {
            Alert.alert("Aceite os termos de serviço", "Para se cadastrar é necessario aceitar os termos de serviço.");
            return;
        }

        const data = await signUp({ 
            name, 
            cpf, 
            date_birth: dateOfBirth, 
            phone, 
            email, 
            password,
        });

        router.push({
          pathname: "/confirmemailscreen",
          params: {email: email}
        });
        
    }

    return (
        <View>
            <Title align="center" style={{marginBottom: 0}}>CADASTRE-SE</Title>
            <Subtitle align="center">Por favor, cadastre-se para começar</Subtitle>
            <View style={styles.input_group}>
                <Text style={styles.label}>NOME COMPLETO</Text>
                <Input placeholder="Nome completo" value={name} onChangeText={setName} />
            </View>
            <View style={styles.input_group}>
                <Text style={styles.label}>CPF</Text>
                <Input placeholder="000.000.000-00" value={cpf} onChangeText={setCPF} />
            </View>
            <View style={styles.input_group}>
                <Text style={styles.label}>DATA DE NASCIMENTO</Text>
                <DatePickerInput
                    value={dateOfBirth}
                    onDateChange={handleDateChange}
                    placeholder="Data de Nascimento (DD/MM/YYYY)"
                    // inputRef={inputDateOfBirthRef}
                    // scrollToInput={scrollToInput}
                    // nextInputRef={inputPhoneRef}
                    maximumDate={new Date()}
                    minimumDate={new Date('1900-01-01')} 
                />
            </View>
            <View style={styles.input_group}>
                <Text style={styles.label}>TELEFONE</Text>
                <PhoneInput
                    value={phone}
                    onChangeText={setPhone}
                    label="TELEFONE"
                    // ref={inputPhoneRef}
                    // ... outros props
                />
            </View>
            <View style={styles.input_group}>
                <Text style={styles.label}>EMAIL</Text>
                <EmailInput  value={email} onValueChange={setEmail}  />
            </View>
            <View style={styles.input_group}>
                <Text style={styles.label}>SENHA</Text>
                <InputPassword
                    value={password}
                    onValueChange={setPassword}
                    placeholder="Digite sua senha"
                    isRegistration={true}
                />
            </View>
            <View style={styles.input_group}>
                <Text style={styles.label}>CONFIRMAR SENHA</Text>
                <InputPassword
                    value={confirmPassword}
                    onValueChange={setConfirmPassword}
                    placeholder="Confirmar senha"
                    isRegistration={true}
                />
            </View>
            <View style={styles.options_row}>
                <View style={styles.container_checkbox}>
                    <Checkbox
                      value={isChecked}
                      onValueChange={setIsChecked}
                      style={styles.checkbox}
                      color={isChecked ? "#FB0202" : undefined}
                    />
                    <Text
                      style={{
                        fontFamily: "Inter",
                        fontSize: theme.fontSizes.xs,
                        marginRight: theme.spacing.xs,
                        color: theme.colors.text,
                      }}
                    >
                      Eu concordo com os
                    </Text>
                    <TouchableOpacity
                      style={{
                        margin: theme.spacing.clear,
                        padding: theme.spacing.clear,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          margin: theme.spacing.clear,
                          padding: theme.spacing.clear,
                        }}
                      >
                        <Text style={styles.terms_of_use}>
                          Termos de Uso
                          <Text style={{ color: theme.colors.text }}>.</Text>
                        </Text>
                      </View>
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.submit_button_wrapper}>
                <Button
                  title="CADASTRAR-SE"
                  onPress={handleSignUp}
                  style={styles.login_button}
                />
            </View>
        </View>
    )
}