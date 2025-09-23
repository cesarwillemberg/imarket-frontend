import { useTheme } from "@/themes/ThemeContext";

import { Button } from "@/components/common/Button";
import DatePickerInput from "@/components/common/DatePickerInput";
import { Input } from "@/components/common/Input/Index";
import EmailInput from "@/components/common/InputEmail";
import PhoneInput from "@/components/common/PhoneInput";
import { useSession } from "@/providers/SessionContext/Index";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { findNodeHandle, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import ChangeProfilePicture from "../profile/ChangeProfilePicture";
import createStyles from "./styled";

const EditProfileForm: FC = () => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const router = useRouter();
    const { user, getInfoUser, updateProfile } = useSession();
    
    const [userId, setUserId] = useState<string>("");
    const [profilePicture, setProfilePicture] = useState<string>("");
    const [profilePictureBase64, setProfilePictureBase64] = useState<string>("");
    
    const [name, setName] = useState<string>("");
    const [cpf, setCPF] = useState<string>("");
    const [dateOfBirth, setDateOfBirth] = useState<string>("");
    const [phone, setPhone] = useState<string>(String(""));
    const [email, setEmail] = useState<string>("");
    

    // const [password, setPassword] = useState<string>("");
    // const [confirmPassword, setConfirmPassword] = useState<string>("");

    const [isLoadingBtnSave, setIsLoadingBtnSave] = useState<boolean>(false);
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

    const handleSave = async () => {
        setIsLoadingBtnSave(true);
        let params = {
            id: userId,
            profile_picture: profilePicture,
            profile_picture_base64: profilePictureBase64,
            name: name,
            cpf: cpf,
            date_birth: dateOfBirth,
            phone: phone,
            email: email,
        }

        const data = await updateProfile(params);
        
        setIsLoadingBtnSave(false);
    }

    const handleCancel = () => {
        router.back();
    }

    const handleGetInfoUser = async () => {
        if (!user || !user.id) {
            console.warn("Usuário não disponível ou ID indefinido.");
            return;
        }

        try {
            const data = await getInfoUser({id: user.id});
            setUserId(data.id);
            setProfilePicture(data.profile_picture);
            setName(data.nome);
            setCPF(data.cpf);
            setDateOfBirth(data.data_nascimento);
            setPhone(data.telefone);
            setEmail(data.email)
        
        } catch (error) {
            console.error("Erro ao buscar informações do usuário:", error);
        }
    }

    const fetchData = async () => {
        setIsLoading(true);
        await handleGetInfoUser();
        setIsLoading(false);
    };

    useEffect(()=>{
        fetchData();
    },[])

    const onRefresh = async () => {
        setRefreshing(true);
        await handleGetInfoUser();
        setRefreshing(false);
    };


    return (
        <ScrollView
            contentContainerStyle={[styles.container, isLoading ? { justifyContent: "center" } : {}]}
            scrollEnabled={true}
            refreshControl={
                <RefreshControl   
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    title="Carregando..."
                    colors={['#ff0000', '#00ff00', '#0000ff']}
                    tintColor="#ff0000"
                    titleColor="#00ff00" 
                />
            }
        >
            <View style={{marginVertical: 20}}>
                <ChangeProfilePicture 
                    image={profilePicture} 
                    setImage={setProfilePicture}
                    modalVisible={modalVisible}
                    setModalVisible={setModalVisible}
                    openImageOptions={openImageOptions}
                    profilePictureBase64={profilePictureBase64}
                    setImageBase64={setProfilePictureBase64}
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
                        inputMode="text"
                        returnKeyType={"next"}
                        pointerEvents="none"
                        editable={false}
                        selectTextOnFocus={false}
                        caretHidden={false} 
                        ref={inputCPFRf}
                        value={cpf} 
                        onChangeText={setCPF} 
                        onSubmitEditing={() => {
                            inputDateOfBirthRef.current?.focus();
                            scrollToInput(inputDateOfBirthRef);
                        }}
                        onFocus={() => scrollToInput(inputCPFRf)}
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
                        onChangePhoneNumber={setPhone}
                        label="TELEFONE"
                        ref={inputPhoneRef}
                        onSubmitEditing={() => {
                            inputEmailRef.current?.focus();
                            scrollToInput(inputEmailRef);
                        }}
                        onFocus={() => scrollToInput(inputEmailRef)}
                        returnKeyType={"next"}
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
                        loading={isLoadingBtnSave} 
                        disabled={isLoadingBtnSave}
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