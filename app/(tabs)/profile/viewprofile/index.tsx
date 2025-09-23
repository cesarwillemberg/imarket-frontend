import ProfielPictureAndName from "@/components/auth/profile/ProfilePictureandName";
import { Button } from "@/components/common/Button";
import HeaderScreen from "@/components/common/HeaderScreen";
import { ScreenContainer } from "@/components/common/ScreenContainer/Index";
import { useSession } from "@/providers/SessionContext/Index";
import { useTheme } from "@/themes/ThemeContext";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from "react-native";
import createStyles from "./styled";


export default function ViewProfile() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const { user, getInfoUser } = useSession();

  const [profilePicture, setProfilePicture] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [cpf, setCPF] = useState<string>("");
  const [date_of_birth, set_date_of_birth] = useState<string>("");
  const [email, set_email] = useState<string>("");
  const [phone, set_phone] = useState<string>("");

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const handleGetInfoUser = async () => {
    if (!user || !user.id) {
      console.warn("Usuário não disponível ou ID indefinido.");
      return;
    }

    try {
      const data = await getInfoUser({id: user.id});

      setProfilePicture(data.profile_picture || "")
      setName(data.nome || "");
      setCPF(data.cpf || "");
      set_date_of_birth(data.data_nascimento || "");
      set_email(data.email || "");
      set_phone(data.telefone || "");
      
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

  const handleAddress = () => {
    router.push("/(tabs)/profile/address");
  }

  const handlePayments = () => {
    router.push("/(tabs)/profile/payments");
  }

  const handleEditProfile = () => {
    router.push("/(tabs)/profile/editprofile");
  }

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <HeaderScreen title="Informações do Perfil" />
        <ScrollView
          contentContainerStyle={[styles.container, isLoading ? { justifyContent: "center" } : {}]}
          // scrollEnabled={false}
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
          {isLoading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          ) : (
            <>
              <ProfielPictureAndName pathImage={profilePicture} />
              <View>
                <Text style={styles.label_infos}>Informações Pessoais</Text>
                <View style={styles.wrapper_informations}>
                  <View style={styles.info_wrapper}>
                    <Text style={styles.label}>CPF:</Text>
                    <Text style={styles.text}>{cpf}</Text>
                  </View>
                  <View style={styles.info_wrapper}>
                    <Text style={styles.label}>Data de Nascimento:</Text>
                    <Text style={styles.text}>{date_of_birth}</Text>
                  </View>
                  <View style={styles.info_wrapper}>
                    <Text style={styles.label}>Email:</Text>
                    <Text style={styles.text}>{email}</Text>
                  </View>
                  <View style={styles.info_wrapper}>
                    <Text style={styles.label}>Telefone:</Text>
                    <Text style={styles.text}>{phone}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.wrapper_buttons}>
                <View style={styles.wrapper_buttons_address_payments}>
                  <View>
                    <Button 
                      title="Meus Endereços" 
                      onPress={handleAddress} 
                      variant="secondary" 
                      textStyle={{ fontSize: 12, color: theme.colors.text}}
                    />
                  </View>
                  <View>
                    <Button 
                      title="Formas de Pagamento" 
                      onPress={handlePayments} 
                      variant="secondary" 
                      textStyle={{ fontSize: 12, color: theme.colors.text}}
                    />
                  </View>
                </View>
                <View style={styles.wrapper_button_edit_profile}>
                  <Button 
                    title="Editar Perfil" 
                    onPress={handleEditProfile} 
                    style={{paddingVertical: 15}}
                  />
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

