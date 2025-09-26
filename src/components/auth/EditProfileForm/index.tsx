import { useTheme } from "@/src/themes/ThemeContext";

import { Button } from "@/src/components/common/Button";
import DatePickerInput from "@/src/components/common/DatePickerInput";
import { Input } from "@/src/components/common/Input";
import EmailInput from "@/src/components/common/InputEmail";
import PhoneInput from "@/src/components/common/PhoneInput";
import { Subtitle } from "@/src/components/common/subtitle";
import { useSession } from "@/src/providers/SessionContext/Index";
import { useEmailChange } from "@/src/hooks/useEmailChange";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import React, { FC, useEffect, useRef, useState } from "react";
import { Alert, findNodeHandle, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import ChangeProfilePicture from "../profile/ChangeProfilePicture";
import createStyles from "./styled";

const EditProfileForm: FC = () => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const router = useRouter();
    const { user, getInfoUser, updateProfile, updateProfilePicture, removeProfilePicture } = useSession();
    
    const [userId, setUserId] = useState<string>("");
    const [profilePicture, setProfilePicture] = useState<string>("");
    
    const [name, setName] = useState<string>("");
    const [cpf, setCPF] = useState<string>("");
    const [dateOfBirth, setDateOfBirth] = useState<string>("");
    const [phone, setPhone] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [originalEmail, setOriginalEmail] = useState<string>("");
    const [showSuccessAnimation, setShowSuccessAnimation] = useState<boolean>(false);

    // Hook para alteração de email
    const { 
        handleEmailChange, 
        isChangingEmail, 
        hasEmailChanged 
    } = useEmailChange({
        currentEmail: originalEmail,
        onEmailChangeSuccess: () => {
            console.log("✅ Processo de alteração de email iniciado");
        }
    });

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
    const animationSaveSuccess = useRef<LottieView>(null);

    const openImageOptions = () => {
        setModalVisible(true);
    };

    
    const handleDateChange = (date: Date, formattedDate: string) => {
        setDateOfBirth(formattedDate);
    };
    
        // Wrapper para garantir que phone seja sempre string
    const handlePhoneChange = (value: any) => {
        const stringValue = value ? String(value) : '';
        setPhone(stringValue);
    };

    const scrollToInput = (inputRef: React.RefObject<any>) => {
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
        console.log("🔵 handleSave iniciado");
        setIsLoadingBtnSave(true);
        const path = `${userId}/${userId}-avatar.jpg`;
        let publicUrl = profilePicture;

        try {
            // Processar imagem de perfil
            if (profilePicture && profilePicture.startsWith("file://")) {
                console.log("🖼️ Processando imagem de perfil...");
                publicUrl = await updateProfilePicture({ 
                    localFilePath: profilePicture, 
                    storageFilePath: path 
                });
            } else if (profilePicture === "") {
                console.log("🗑️ Removendo imagem de perfil...");
                await removeProfilePicture({ storageFilePath: path });
                publicUrl = "";
            }
        } catch {
            console.log("❌ Erro ao processar imagem de perfil");
            Alert.alert("Erro ao processar imagem de perfil");
            setIsLoadingBtnSave(false);
            return;
        }

        try {
            // Se o email mudou, processar alteração de email SEPARADAMENTE
            if (hasEmailChanged(email)) {
                console.log("📧 Email mudou no EditProfileForm, processando alteração...");
                console.log("📧 Email atual:", originalEmail);
                console.log("📧 Novo email:", email);
                
                const emailChanged = await handleEmailChange(email);
                console.log("📧 Resultado do handleEmailChange:", emailChanged);
                
                if (!emailChanged) {
                    console.log("📧 Alteração de email cancelada ou falhou");
                    setIsLoadingBtnSave(false);
                    return; // Usuário cancelou ou erro ocorreu
                }
                // Se chegou aqui, o email está sendo processado e o usuário será deslogado
                // Não precisa continuar com o updateProfile
                console.log("📧 Processo de alteração de email iniciado, retornando...");
                return;
            }

            console.log("💾 Salvando outros dados do perfil...");
            // Atualizar outros dados do perfil (SEM email)
            let params = {
                id: userId,
                profile_picture: publicUrl,
                name: name,
                cpf: cpf,
                date_birth: dateOfBirth,
                phone: phone,
                // email: NÃO incluir aqui - foi tratado separadamente
            }

            const { errorUpdate } = await updateProfile(params);

            if (errorUpdate) {
                console.error("Error in updateProfile:", errorUpdate);
                Alert.alert("Erro ao atualizar perfil");
                setIsLoadingBtnSave(false);
                return;
            } 
            
            // Sucesso - mostrar animação
            console.log("✅ Perfil atualizado com sucesso");
            setShowSuccessAnimation(true);
            animationSaveSuccess.current?.play();
            setIsLoadingBtnSave(false);

        } catch (error: any) {
            console.error("Erro ao salvar:", error);
            Alert.alert("Erro", "Não foi possível salvar as alterações");
            setIsLoadingBtnSave(false);
        }
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
            setUserId(data.id || '');
            setProfilePicture(data.profile_picture || '');
            setName(data.nome || '');
            setCPF(data.cpf || '');
            setDateOfBirth(data.data_nascimento || '');
            setPhone(data.telefone ? String(data.telefone) : '');
            const userEmail = data.email || '';
            setEmail(userEmail);
            setOriginalEmail(userEmail); // Salvar email original para comparação
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
        <>
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
                <View style={{marginVertical: 20, justifyContent: "center", alignItems: "center"}}>
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
                            onChangePhoneNumber={handlePhoneChange}
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
                    <View style={{marginTop: 30}}>
                        <Button 
                            title="Salvar Alterações" 
                            loading={isLoadingBtnSave || isChangingEmail} 
                            disabled={isLoadingBtnSave || isChangingEmail}
                            onPress={handleSave}
                            style={{paddingVertical: 12}} 
                        />
                    </View>
                    <View style={{marginTop: 20}}>
                        <Button 
                            title="Cancelar" 
                            variant="outline" 
                            onPress={handleCancel}
                        />
                    </View>
                </View>
            </ScrollView>
            {showSuccessAnimation && (
                <View style={{
                    position: "absolute",
                    top: 0, left: 0, right: 0, bottom: 0,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "rgba(0,0,0,0.5)"
                }}>
                    <LottieView
                        source={require("@/src/assets/animations/check-mark-success.json")}
                        style={{ width: 250, height: 250 }}
                        loop={false}
                        autoPlay={true}
                        ref={animationSaveSuccess}
                        onAnimationFinish={() => {
                            setShowSuccessAnimation(false);
                            router.dismissAll();
                            router.push("/(auth)/profile/viewprofile");
                        }}
                    />
                    <Subtitle align="center" >Perfil Atualizado com sucesso!!!</Subtitle>
                </View>
            )}
        </>
    )
}


export default EditProfileForm;