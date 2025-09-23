import { useTheme } from "@/themes/ThemeContext";

import { Button } from "@/components/common/Button";
import DatePickerInput from "@/components/common/DatePickerInput";
import { Input } from "@/components/common/Input/Index";
import EmailInput from "@/components/common/InputEmail";
import PhoneInput from "@/components/common/PhoneInput";
import { useSession } from "@/providers/SessionContext/Index";
import { UserInfo } from "@/services/auth-service";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { findNodeHandle, ScrollView, Text, TextInput, View } from "react-native";
import ChangeProfilePicture from "../profile/ChangeProfilePicture";
import createStyles from "./styled";

interface EditProfileProps {
    userData: UserInfo;
}

const EditProfileForm: React.FC<EditProfileProps> = ({ userData }) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const router = useRouter();
    const { user, getInfoUser } = useSession();
    

    const [profilePicture, setProfilePicture] = useState<string>(userData.profile_picture || "");
    const [name, setName] = useState<string>(userData.nome || "");
    const [cpf, setCPF] = useState<string>(userData.cpf || "");
    const [dateOfBirth, setDateOfBirth] = useState<string>(userData.data_nascimento || "");
    const [phone, setPhone] = useState<string>(String(userData.telefone?.toString() ?? ""));

    console.log(userData.telefone);
    console.log(phone);
    

    const [email, setEmail] = useState<string>(userData.email || "");
    

    // const [password, setPassword] = useState<string>("");
    // const [confirmPassword, setConfirmPassword] = useState<string>("");

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [modalVisible, setModalVisible] = useState<boolean>(false);

    const inputNameRef = useRef<TextInput>(null);
    const inputCPFRf = useRef<TextInput>(null);
    const inputDateOfBirthRef = useRef<TextInput>(null);
    const inputPhoneRef = useRef<TextInput>(null);
    const inputEmailRef = useRef<TextInput>(null);
    // const inputPasswordRef = useRef<TextInput>(null);
    // const inputConfirmPasswordRef = useRef<TextInput>(null);
    const scrollViewRef = useRef<ScrollView>(null);

    const openImageOptions = () => {
        setModalVisible(true);
    };

    
    const handleDateChange = (date: Date, formattedDate: string) => {
        setDateOfBirth(formattedDate);
    };
    
    const scrollToInput = (inputRef: React.RefObject<TextInput>) => {
        if (!inputRef.current || !scrollViewRef.current) return;

        const inputHandle = findNodeHandle(inputRef.current);
        if (!inputHandle) return;

        scrollViewRef.current.scrollResponderScrollNativeHandleToKeyboard(
            inputHandle,
            20,
            true
        );
    };

    const handleSave = () => {

    }

    const handleCancel = () => {

    }

    // const handleGetInfoUser = async () => {
    //     if(!user) return null;
    //     const data = getInfoUser(user.id)

    //     // setUserData(data);
    //     // setName(data?.nome);
    //     // setCPF(data?.cpf);
    //     // set_date_of_birth(data?.data_nascimento);
    //     // set_email(data?.email);
    //     // set_phone(data?.telefone);
    
    // }


    // const fetchData = async () => {
    //     setIsLoading(true);
    //     await handleGetInfoUser();
    //     setIsLoading(false);
    // };

    // useEffect(()=>{
    //     fetchData();
    // },[])

    // const onRefresh = async () => {
    //     setRefreshing(true);
    //     await handleGetInfoUser();
    //     setRefreshing(false);
    // };


    return (
        <ScrollView>
            <View style={{marginVertical: 20}}>
                <ChangeProfilePicture 
                    image={profilePicture} 
                    setImage={setProfilePicture}
                    modalVisible={modalVisible}
                    setModalVisible={setModalVisible}
                    openImageOptions={openImageOptions}
                />
            </View>
            <View>
                <View style={styles.input_group}>
                    <Text style={styles.label}>NOME COMPLETO</Text>
                    <Input 
                    placeholder="Nome completo" 
                    value={name} 
                    onChangeText={setName} 
                    onSubmitEditing={() => {
                        inputCPFRf.current?.focus();
                        scrollToInput(inputCPFRf);
                    }}
                    onFocus={() => scrollToInput(inputNameRef)}
                    ref={inputNameRef}
                    returnKeyType={"next"}
                    inputMode="text"
                    />
                </View>
                <View style={styles.input_group}>
                    <Text style={styles.label}>CPF</Text>
                    <Input 
                    placeholder="000.000.000-00" 
                    value={cpf} 
                    onChangeText={setCPF} 
                    onSubmitEditing={() => {
                        inputDateOfBirthRef.current?.focus();
                        scrollToInput(inputDateOfBirthRef);
                    }}
                    onFocus={() => scrollToInput(inputCPFRf)}
                    ref={inputCPFRf}
                    returnKeyType={"next"}
                    inputMode="text"
                    />
                </View>
                <View style={styles.input_group}>
                    <Text style={styles.label}>DATA DE NASCIMENTO</Text>
                    <DatePickerInput
                        value={dateOfBirth}
                        onDateChange={handleDateChange}
                        placeholder="Data de Nascimento (DD/MM/YYYY)"
                        maximumDate={new Date()}
                        minimumDate={new Date('1900-01-01')} 
                        nextInputRef={inputPhoneRef}
                        inputRef={inputDateOfBirthRef}
                        scrollToInput={scrollToInput}
                        returnKeyType={"next"}
                        inputMode="text"
                    />
                </View>
                <View style={styles.input_group}>
                    <Text style={styles.label}>TELEFONE</Text>
                    <PhoneInput
                        value={phone}
                        onChangeText={setPhone}
                        label="TELEFONE"
                        ref={inputPhoneRef}
                        onSubmitEditing={() => {
                            inputEmailRef.current?.focus();
                            scrollToInput(inputEmailRef);
                        }}
                        onFocus={() => scrollToInput(inputEmailRef)}
                        returnKeyType={"next"}
                        keyboardType="numeric"
                    />
                </View>
                <View style={styles.input_group}>
                    <Text style={styles.label}>EMAIL</Text>
                    <EmailInput  
                    value={email} 
                    onValueChange={setEmail}  
                    ref={inputEmailRef}
                    // passwordRef={inputPasswordRef}
                    scrollToInput={scrollToInput}
                    />
                </View>
                {/* <View style={styles.input_group}>
                    <Text style={styles.label}>SENHA</Text>
                    <InputPassword
                        value={password}
                        onValueChange={setPassword}
                        placeholder="Digite sua senha"
                        isRegistration={true}
                        ref={inputPasswordRef}
                        onSubmitEditing={() => {
                        inputConfirmPasswordRef.current?.focus();
                        scrollToInput(inputConfirmPasswordRef);
                        }}
                        onFocus={() => scrollToInput(inputPasswordRef)}
                        returnKeyType="next"
                    />
                </View>
                <View style={styles.input_group}>
                    <Text style={styles.label}>CONFIRMAR SENHA</Text>
                    <InputPassword
                        value={confirmPassword}
                        onValueChange={setConfirmPassword}
                        placeholder="Confirmar senha"
                        isRegistration={true}
                        returnKeyType="done"
                        ref={inputConfirmPasswordRef}
                    />
                </View> */}
                <View style={{marginTop: 20}}>
                    <Button 
                        title="Salvar Alterações" 
                        onPress={handleSave} 
                    />
                </View>
                <View style={{marginTop: 30}}>
                    <Button 
                        title="Cancelar" 
                        variant="outline" 
                        onPress={handleCancel} 
                    />
                </View>
            </View>
        </ScrollView>
    )
}


export default EditProfileForm;